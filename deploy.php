<?php
namespace Deployer;

use Deployer\Exception\Exception;

require 'recipe/common.php';

set('application', 'phala_public_watchdog');
set('repository', 'git@github.com:l00k/phala-public-watchdog.git');

set('git_tty', true);
set('allow_anonymous_stats', false);

set('shared_dirs', [
    '.db-data',
]);
set('shared_files', [
    '.env',
]);
set('shared_files:copy', [
    'src/etc/local/config.ts',
]);
set('copy_dirs', [
    'node_modules',
]);


host('main')
    ->hostname('100k-dev-server')
    ->user('user')
    ->set('deploy_path', '/srv/phala-watchdog');

localhost('local')
    ->user('l00k')
    ->set('deploy_path', realpath(__DIR__));

localhost()
    ->shellCommand('bash -s');

desc('Deploy your project');
task('deploy', [
    'deploy:info',
    'deploy:prepare',
    'deploy:release',
    'deploy:update_code',
    'deploy:shared',
    'deploy:shared:copy',
    'deploy:copy_dirs',
    'deploy:writable',
    'deploy:clear_paths',
    'server:down',
    'deploy:symlink',
    'server:up',
    'cleanup',
    'success'
]);

after('deploy:failed', 'deploy:unlock');


task('server:down', function () {
    if (!test('[[ -e {{deploy_path}}/current ]]')) {
        return;
    }

    run("
        cd {{deploy_path}}/current;
        ps xo '%r %c %a' | grep 'monitor.sh' | grep -v 'grep' | awk '{{print -$1}}' | xargs -I {} bash -c 'kill -s 9 {}'
    ", [ 'tty' => true ]);
    
    run("
        cd {{deploy_path}}/current;
        docker-compose down --remove-orphans
    ", [ 'tty' => true ]);
});

task('server:up', function () {
    run("
        cd {{deploy_path}}/current
        chmod +x etc/run.sh
        chmod +x etc/monitor.sh
    ", [ 'tty' => true ]);
    
    try {
        run("
            cd {{deploy_path}}/current
            nohup ./etc/monitor.sh &
        ", [ 'timeout' => 1 ]);
    }
    catch (\Exception $e) {}
    
    run("
        cd {{deploy_path}}/current;
        docker-compose build

        docker-compose up -d db

        docker-compose run app_bot yarn install --only=production
        docker-compose run app_bot yarn mikro-orm migration:up

        docker-compose up -d
    ", [ 'tty' => true ]);
});



task('deploy:shared:copy', function () {
    $sharedPath = "{{deploy_path}}/shared";

    foreach (get('shared_files:copy') as $file) {
        $dirname = dirname(parse($file));

        if (!test("[ -d {$sharedPath}/{$dirname} ]")) {
            run("mkdir -p {$sharedPath}/{$dirname}");
        }

        if (!test("[ -f $sharedPath/$file ]") && test("[ -f {{release_path}}/$file ]")) {
            run("cp -rv {{release_path}}/$file $sharedPath/$file");
        }

        run("if [ -f $(echo {{release_path}}/$file) ]; then rm -rf {{release_path}}/$file; fi");
        run("if [ ! -d $(echo {{release_path}}/$dirname) ]; then mkdir -p {{release_path}}/$dirname;fi");
        
        run("touch $sharedPath/$file");

        run("cp -r $sharedPath/$file {{release_path}}/$file");
    }
});


task('db:backup', function () {
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    $envPath = test('[[ -e {{deploy_path}}/shared ]]')
        ? 'shared/.env'
        : './.env';

    run("
        cd {{deploy_path}}
        set -o allexport; source $envPath; set +o allexport
        mysqldump -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u root -proot \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);
});

task('db:pull', function () {
    $localCwd = runLocally('pwd');
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    run("
        cd {{deploy_path}}
        set -o allexport; source shared/.env; set +o allexport
        mysqldump -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);

    runLocally("
        cd $localCwd
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    download(
        "{{deploy_path}}/.dep/dbdumps/$dumpname",
        "$localCwd/.dep/dbdumps/$dumpname"
    );

    runLocally("
        cd $localCwd
        set -o allexport; source $localCwd/.env; set +o allexport;
        mysql -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < $localCwd/.dep/dbdumps/$dumpname;
    ", ['tty' => true]);

    $confirm = askConfirmation('Clear user records?', true);
    if ($confirm) {
        runLocally("
            cd $localCwd
            set -o allexport; source $localCwd/.env; set +o allexport;
            mysql -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < $localCwd/.dep/scripts/cleanup.sql;
        ", ['tty' => true]);
    }

    run("cd {{deploy_path}} && rm .dep/dbdumps/$dumpname");
});

task('db:push', function () {
    $localCwd = runLocally('pwd');
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    runLocally("
        cd $localCwd
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    runLocally("
        cd $localCwd
        set -o allexport; source $localCwd/.env; set +o allexport
        mysqldump --column-statistics=0 -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u root -proot \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    upload(
        "$localCwd/.dep/dbdumps/$dumpname",
        "{{deploy_path}}/.dep/dbdumps/$dumpname"
    );

    run("
        cd {{deploy_path}}
        set -o allexport; source shared/.env; set +o allexport
        mysql -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < .dep/dbdumps/$dumpname;
    ");

    runLocally("rm .dep/dbdumps/$dumpname");
});

