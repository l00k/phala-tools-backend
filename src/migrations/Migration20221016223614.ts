import { Migration } from '@mikro-orm/migrations';

export class Migration20221016223614 extends Migration {

  async up(): Promise<void> {
    this.addSql('RENAME TABLE `app_state` TO `core_app_state`;');

    this.addSql('drop table if exists `stats_worker`;');
  }

  async down(): Promise<void> {
    this.addSql('create table `app_state` (`id` varchar(255) not null, `value` json not null, primary key (`id`)) default character set utf8mb4 engine = InnoDB;');

    this.addSql('create table `stats_worker` (`id` int unsigned not null auto_increment primary key, `public_key` varchar(255) not null, `binding_account` varchar(255) null, `operator_id` int unsigned not null, `stake_pool_id` int unsigned null, `initial_score` int unsigned not null, `confidence_level` int unsigned not null, `state` enum(\'NotReady\', \'Ready\', \'MiningIdle\', \'MiningActive\', \'MiningUnresponsive\', \'MiningCoolingDown\') not null, `ve` double not null, `v` double not null, `p_init` int unsigned not null, `p_instant` int unsigned not null, `total_rewards` double not null, `updated_at` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_worker` add index `stats_worker_operator_id_index`(`operator_id`);');
    this.addSql('alter table `stats_worker` add index `stats_worker_stake_pool_id_index`(`stake_pool_id`);');

    this.addSql('alter table `stats_worker` add constraint `stats_worker_operator_id_foreign` foreign key (`operator_id`) references `phala_account` (`id`) on update cascade on delete restrict;');
    this.addSql('alter table `stats_worker` add constraint `stats_worker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stats_stakepoolentry` (`id`) on update cascade on delete set null;');

    this.addSql('drop table if exists `core_app_state`;');
  }

}
