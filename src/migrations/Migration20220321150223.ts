import { Migration } from '@mikro-orm/migrations';

export class Migration20220321150223 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `core_tasker_task` (`id` int unsigned not null auto_increment primary key, `task_key` varchar(255) not null, `last_execution` datetime null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `core_tasker_task` add unique `core_tasker_task_task_key_unique`(`task_key`);');

    this.addSql('create table `watchdog_user` (`id` int unsigned not null auto_increment primary key, `messaging_channel` enum(\'discord\', \'telegram\') not null, `user_id` varchar(255) not null, `chat_id` varchar(255) not null, `token` varchar(255) null, `name` varchar(255) not null, `created_at` datetime not null, `updated_at` datetime not null, `config` json not null) default character set utf8mb4 engine = InnoDB;');

    this.addSql('create table `watchdog_state_node` (`id` int unsigned not null auto_increment primary key, `node_key` varchar(255) not null, `name` varchar(255) not null, `primary` tinyint(1) not null, `owner_id` int(11) unsigned null, `relay_chain` json not null, `para_chain` json not null, `last_update` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_state_node` add unique `watchdog_state_node_node_key_unique`(`node_key`);');
    this.addSql('alter table `watchdog_state_node` add index `watchdog_state_node_owner_id_index`(`owner_id`);');

    this.addSql('create table `watchdog_issue_node` (`id` int unsigned not null auto_increment primary key, `occurrence_date` datetime not null, `node_state_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_issue_node` add index `watchdog_issue_node_node_state_id_index`(`node_state_id`);');
    this.addSql('alter table `watchdog_issue_node` add unique `watchdog_issue_node_node_state_id_unique`(`node_state_id`);');

    this.addSql('create table `watchdog_account` (`id` int unsigned not null auto_increment primary key, `address` varchar(255) not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_account` add unique `watchdog_account_address_unique`(`address`);');

    this.addSql('create table `watchdog_stakepool` (`id` int unsigned not null auto_increment primary key, `on_chain_id` int(11) not null, `owner_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_stakepool` add index `watchdog_stakepool_owner_id_index`(`owner_id`);');

    this.addSql('create table `watchdog_issue_uworker` (`id` int unsigned not null auto_increment primary key, `occurrence_date` datetime not null, `worker_account` varchar(255) not null, `worker_pub_key` varchar(255) not null, `stake_pool_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_issue_uworker` add unique `watchdog_issue_uworker_worker_account_unique`(`worker_account`);');
    this.addSql('alter table `watchdog_issue_uworker` add unique `watchdog_issue_uworker_worker_pub_key_unique`(`worker_pub_key`);');
    this.addSql('alter table `watchdog_issue_uworker` add index `watchdog_issue_uworker_stake_pool_id_index`(`stake_pool_id`);');

    this.addSql('create table `watchdog_stakepool_observation` (`id` int unsigned not null auto_increment primary key, `user_id` int(11) unsigned not null, `stake_pool_id` int(11) unsigned not null, `account_id` int(11) unsigned not null, `mode` enum(\'owner\', \'delegator\') null, `last_notifications` json not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_stakepool_observation` add index `watchdog_stakepool_observation_user_id_index`(`user_id`);');
    this.addSql('alter table `watchdog_stakepool_observation` add index `watchdog_stakepool_observation_stake_pool_id_index`(`stake_pool_id`);');
    this.addSql('alter table `watchdog_stakepool_observation` add index `watchdog_stakepool_observation_account_id_index`(`account_id`);');

    this.addSql('create table `watchdog_user_accounts` (`user_id` int(11) unsigned not null, `account_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_user_accounts` add index `watchdog_user_accounts_user_id_index`(`user_id`);');
    this.addSql('alter table `watchdog_user_accounts` add index `watchdog_user_accounts_account_id_index`(`account_id`);');
    this.addSql('alter table `watchdog_user_accounts` add primary key `watchdog_user_accounts_pkey`(`user_id`, `account_id`);');

    this.addSql('create table `app_state` (`id` varchar(255) not null, `value` json not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `app_state` add primary key `app_state_pkey`(`id`);');

    this.addSql('alter table `watchdog_state_node` add constraint `watchdog_state_node_owner_id_foreign` foreign key (`owner_id`) references `watchdog_user` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `watchdog_issue_node` add constraint `watchdog_issue_node_node_state_id_foreign` foreign key (`node_state_id`) references `watchdog_state_node` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_stakepool` add constraint `watchdog_stakepool_owner_id_foreign` foreign key (`owner_id`) references `watchdog_account` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_issue_uworker` add constraint `watchdog_issue_uworker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `watchdog_stakepool` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_stakepool_observation` add constraint `watchdog_stakepool_observation_user_id_foreign` foreign key (`user_id`) references `watchdog_user` (`id`) on update cascade;');
    this.addSql('alter table `watchdog_stakepool_observation` add constraint `watchdog_stakepool_observation_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `watchdog_stakepool` (`id`) on update cascade;');
    this.addSql('alter table `watchdog_stakepool_observation` add constraint `watchdog_stakepool_observation_account_id_foreign` foreign key (`account_id`) references `watchdog_account` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_user_accounts` add constraint `watchdog_user_accounts_user_id_foreign` foreign key (`user_id`) references `watchdog_user` (`id`) on update cascade on delete cascade;');
    this.addSql('alter table `watchdog_user_accounts` add constraint `watchdog_user_accounts_account_id_foreign` foreign key (`account_id`) references `watchdog_account` (`id`) on update cascade on delete cascade;');

    this.addSql('alter table `watchdog_user` add unique `watchdog_user_messaging_channel_user_id_unique`(`messaging_channel`, `user_id`);');
  }

}
