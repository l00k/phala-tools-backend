<?php
namespace Deployer;

use Deployer\Exception\Exception;
use Deployer\Task\Context;

require 'recipe/common.php';

set('application', 'phala_tools_backend');
set('repository', 'git@github.com:l00k/phala-tools-backend.git');

set('git_tty', true);
set('allow_anonymous_stats', false);

set('keep_releases', 3);

set('shared_files:copy', [
    'src/etc/local/config.ts',
    'src/etc/local/variants/khala.ts',
    'src/etc/local/variants/phala.ts',
    '.env',
]);


host('khala')
    ->hostname('ovh-server')
    ->user('ubuntu')
    ->set('app_variant', 'khala')
    ->set('deploy_path', '/srv/khala-100k-dev');
    
host('phala')
    ->hostname('ovh-server')
    ->user('ubuntu')
    ->set('app_variant', 'phala')
    ->set('deploy_path', '/srv/phala-100k-dev');

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
    'deploy:writable',
    'deploy:clear_paths',
    'server:down',
    'deploy:symlink',
    'server:up',
    'cleanup',
    'success'
]);

after('deploy:failed', 'deploy:unlock');



task('copy_from_prev_release', function () {
    if (has('previous_release')) {
        foreach (get('copy_entries') as $file) {
            if (test("[ -e {{previous_release}}/$file ]")) {
                run("cp -r {{previous_release}}/$file {{release_path}}/$file");
            }
        }
    }
});

task('server:restart', function () {
    if (!test('[[ -e {{deploy_path}}/current ]]')) {
        return;
    }
    
    run("
        cd {{deploy_path}}/current;
        docker-compose restart
    ", [ 'tty' => true ]);
});

task('server:down', function () {
    if (!test('[[ -e {{deploy_path}}/current ]]')) {
        return;
    }
    
    run("
        cd {{deploy_path}}/current;
        docker-compose down --remove-orphans
        echo OK
    ", [ 'tty' => true ]);
});

task('tmp', function () {
    run("
        cd {{deploy_path}}/release
        cp -r {{deploy_path}}/current/node_modules .
        chown -R 1000:1000 node_modules
    ", [ 'tty' => true ]);
});

task('server:up', function () {
    run("
        cd {{deploy_path}}/current
        chmod +x etc/run.sh
    ", [ 'tty' => true ]);
    
    run("
        cd {{deploy_path}}/current;
        docker-compose build

        docker-compose run node yarn install --only=production
        docker-compose run node yarn mikro-orm migration:up

        docker-compose down --remove-orphans
        docker-compose up -d api crawler
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
    $target = Context::get()->getHost();
    $hostname = $target->getHostname();
    
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    $envPath = test('[[ -e {{deploy_path}}/shared ]]')
        ? 'shared/.env'
        : './.env';
        
    $statsModifier = $hostname === 'local'
        ? '--column-statistics=0'
        : '';

    writeln('Dumping...');
    run("
        cd {{deploy_path}}
        set -o allexport; source $envPath; set +o allexport
        mysqldump $statsModifier -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u root -proot \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);
});

task('db:restore', function () {
    $envPath = test('[[ -e {{deploy_path}}/shared ]]')
        ? 'shared/.env'
        : './.env';

    writeln('Restoring...');
    run("
        cd {{deploy_path}}
        set -o allexport; source $envPath; set +o allexport
        mysql -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < .dep/dbdumps/torestore.sql;
    ", ['tty' => true]);
});

task('db:cleanup', function () {
    $envPath = test('[[ -e {{deploy_path}}/shared ]]')
        ? 'shared/.env'
        : './.env';

    writeln('Cleaning up...');
    run("
        cd {{deploy_path}}
        set -o allexport; source $envPath; set +o allexport
        mysql -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME -e 'UPDATE `core_tasker_task` SET `last_execution`=NULL WHERE `id`=3;'
    ", ['tty' => true]);
});

task('db:pull', function () {
    $localCwd = runLocally('pwd');
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    writeln('Dumping...');
    run("
        cd {{deploy_path}}
        set -o allexport; source shared/.env; set +o allexport
        mysqldump --column-statistics=0 -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);

    runLocally("
        cd $localCwd
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    writeln('Downloading...');
    download(
        "{{deploy_path}}/.dep/dbdumps/$dumpname",
        "$localCwd/.dep/dbdumps/$dumpname"
    );

    writeln('Importing...');
    runLocally("
        cd $localCwd
        set -o allexport; source $localCwd/.env; set +o allexport;
        mysql -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < $localCwd/.dep/dbdumps/$dumpname;
    ", ['timeout' => 0, 'tty' => true]);

    run("cd {{deploy_path}} && rm .dep/dbdumps/$dumpname");
});

task('db:push', function () {
    $localCwd = runLocally('pwd');
    $dumpname = date('Y-m-d-H-i-s') . '-' . uniqid() . '.sql';

    runLocally("
        cd $localCwd
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    writeln('Dumping...');
    runLocally("
        cd $localCwd
        set -o allexport; source $localCwd/.env; set +o allexport
        mysqldump --column-statistics=0 -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u root -proot \$DB_NAME \
            --ignore-table=db.watchdog_issue_stucked_node \
            --ignore-table=db.watchdog_issue_stucked_node \
            --ignore-table=db.watchdog_issue_unresp_worker \
            --ignore-table=db.watchdog_observation \
            --ignore-table=db.watchdog_state_node \
            --ignore-table=db.watchdog_user \
            > .dep/dbdumps/$dumpname
    ", [ 'tty' => true ]);

    run("
        cd {{deploy_path}}
        [[ -e .dep/dbdumps ]] || mkdir -p .dep/dbdumps
    ");

    writeln('Uploading...');
    upload(
        "$localCwd/.dep/dbdumps/$dumpname",
        "{{deploy_path}}/.dep/dbdumps/$dumpname"
    );

    writeln('Importing...');
    run("
        cd {{deploy_path}}
        set -o allexport; source shared/.env; set +o allexport
        mysql -h 127.0.0.1 -P \$DB_PORT_EXTERNAL -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME < .dep/dbdumps/$dumpname;
    ", ['timeout' => 0, 'tty' => true]);

    runLocally("rm .dep/dbdumps/$dumpname");
});
