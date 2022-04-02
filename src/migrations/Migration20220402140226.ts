import { Migration } from '@mikro-orm/migrations';

export class Migration20220402140226 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `core_tasker_task` (`id` int unsigned not null auto_increment primary key, `task_key` varchar(255) not null, `last_execution` datetime null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `core_tasker_task` add unique `core_tasker_task_task_key_unique`(`task_key`);');

    this.addSql('create table `watchdog_state_node` (`id` int unsigned not null auto_increment primary key, `node_key` varchar(255) not null, `name` varchar(255) not null, `primary` tinyint(1) not null, `owner_id` int(11) unsigned null, `relay_chain` json not null, `para_chain` json not null, `last_update` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_state_node` add unique `watchdog_state_node_node_key_unique`(`node_key`);');
    this.addSql('alter table `watchdog_state_node` add index `watchdog_state_node_owner_id_index`(`owner_id`);');

    this.addSql('create table `watchdog_issue_node` (`id` int unsigned not null auto_increment primary key, `occurrence_date` datetime not null, `node_state_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_issue_node` add index `watchdog_issue_node_node_state_id_index`(`node_state_id`);');
    this.addSql('alter table `watchdog_issue_node` add unique `watchdog_issue_node_node_state_id_unique`(`node_state_id`);');

    this.addSql('create table `phala_account` (`id` int unsigned not null auto_increment primary key, `address` varchar(255) not null, `identity` varchar(255) null, `identity_verified` tinyint(1) not null, `created_at` datetime not null, `updated_at` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `phala_account` add unique `phala_account_address_unique`(`address`);');

    this.addSql('create table `phala_stakepool` (`id` int unsigned not null auto_increment primary key, `on_chain_id` int(11) null, `owner_id` int(11) unsigned not null, `created_at` datetime not null, `updated_at` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `phala_stakepool` add unique `phala_stakepool_on_chain_id_unique`(`on_chain_id`);');
    this.addSql('alter table `phala_stakepool` add index `phala_stakepool_owner_id_index`(`owner_id`);');

    this.addSql('create table `watchdog_issue_uworker` (`id` int unsigned not null auto_increment primary key, `occurrence_date` datetime not null, `worker_account` varchar(255) not null, `worker_pub_key` varchar(255) not null, `stake_pool_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_issue_uworker` add unique `watchdog_issue_uworker_worker_account_unique`(`worker_account`);');
    this.addSql('alter table `watchdog_issue_uworker` add unique `watchdog_issue_uworker_worker_pub_key_unique`(`worker_pub_key`);');
    this.addSql('alter table `watchdog_issue_uworker` add index `watchdog_issue_uworker_stake_pool_id_index`(`stake_pool_id`);');

    this.addSql('create table `watchdog_observation` (`id` int unsigned not null auto_increment primary key, `user_id` int(11) unsigned not null, `stake_pool_id` int(11) unsigned not null, `account_id` int(11) unsigned null, `mode` enum(\'owner\', \'delegator\') null, `config` json not null, `last_notifications` json not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_observation` add index `watchdog_observation_user_id_index`(`user_id`);');
    this.addSql('alter table `watchdog_observation` add index `watchdog_observation_stake_pool_id_index`(`stake_pool_id`);');
    this.addSql('alter table `watchdog_observation` add index `watchdog_observation_account_id_index`(`account_id`);');

    this.addSql('create table `stats_stakepoolentry` (`id` int unsigned not null auto_increment primary key, `stake_pool_id` int(11) unsigned null, `special` varchar(255) null, `last_history_entry_id` int(11) unsigned null, `created_at` datetime not null, `updated_at` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_stakepoolentry` add index `stats_stakepoolentry_stake_pool_id_index`(`stake_pool_id`);');
    this.addSql('alter table `stats_stakepoolentry` add unique `stats_stakepoolentry_stake_pool_id_unique`(`stake_pool_id`);');
    this.addSql('alter table `stats_stakepoolentry` add index `stats_stakepoolentry_last_history_entry_id_index`(`last_history_entry_id`);');
    this.addSql('alter table `stats_stakepoolentry` add unique `stats_stakepoolentry_last_history_entry_id_unique`(`last_history_entry_id`);');

    this.addSql('create table `stats_historyentry` (`id` int unsigned not null auto_increment primary key, `stake_pool_id` int(11) unsigned not null, `entry_nonce` int(11) not null, `entry_date` datetime not null, `commission` DECIMAL(12,7) not null, `workers_num` int(11) not null, `workers_active_num` int(11) not null, `stake_total` DECIMAL(18,4) not null, `cap` DECIMAL(18,4) not null, `stake_free` DECIMAL(18,4) not null, `stake_releasing` DECIMAL(18,4) not null, `stake_remaining` DECIMAL(18,4) not null, `withdrawals` DECIMAL(18,4) not null, `v_total` DECIMAL(24,6) not null, `p_total` int(11) unsigned not null, `rewards_total` DECIMAL(18,4) not null, `current_rewards_daily` DECIMAL(18,4) not null, `current_apr` DECIMAL(12,7) not null, `avg_rewards_daily` DECIMAL(18,4) not null, `avg_apr` DECIMAL(12,7) null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_id_index`(`stake_pool_id`);');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_entry_nonce_index`(`entry_nonce`);');

    this.addSql('create table `stats_worker` (`id` int unsigned not null auto_increment primary key, `public_key` varchar(255) not null, `binding_account` varchar(255) null, `operator_id` int(11) unsigned not null, `stake_pool_id` int(11) unsigned null, `initial_score` int(11) unsigned not null, `confidence_level` int(11) unsigned not null, `state` enum(\'NotReady\', \'Ready\', \'MiningIdle\', \'MiningActive\', \'MiningUnresponsive\', \'MiningCoolingDown\') not null, `ve` DECIMAL(24,6) not null, `v` DECIMAL(24,6) not null, `p_init` int(11) unsigned not null, `p_instant` int(11) unsigned not null, `total_rewards` DECIMAL(18,4) not null, `updated_at` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_worker` add index `stats_worker_operator_id_index`(`operator_id`);');
    this.addSql('alter table `stats_worker` add index `stats_worker_stake_pool_id_index`(`stake_pool_id`);');

    this.addSql('create table `stats_stakepoolentry_issues` (`stake_pool_entry_id` int(11) unsigned not null, `issue_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_stakepoolentry_issues` add index `stats_stakepoolentry_issues_stake_pool_entry_id_index`(`stake_pool_entry_id`);');
    this.addSql('alter table `stats_stakepoolentry_issues` add index `stats_stakepoolentry_issues_issue_id_index`(`issue_id`);');
    this.addSql('alter table `stats_stakepoolentry_issues` add primary key `stats_stakepoolentry_issues_pkey`(`stake_pool_entry_id`, `issue_id`);');

    this.addSql('create table `stats_event` (`id` int unsigned not null auto_increment primary key, `block_number` int(11) not null, `block_date` datetime not null, `type` enum(\'transfer\', \'poolCreated\', \'commissionChange\', \'contribution\', \'withdrawal\', \'slash\', \'halving\', \'badBehavior\') not null, `stake_pool_entry_id` int(11) unsigned null, `source_account_id` int(11) unsigned null, `target_account_id` int(11) unsigned null, `amount` DECIMAL(18,4) null, `additional_data` json not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_event` add index `stats_event_block_number_index`(`block_number`);');
    this.addSql('alter table `stats_event` add index `stats_event_type_index`(`type`);');
    this.addSql('alter table `stats_event` add index `stats_event_stake_pool_entry_id_index`(`stake_pool_entry_id`);');
    this.addSql('alter table `stats_event` add index `stats_event_source_account_id_index`(`source_account_id`);');
    this.addSql('alter table `stats_event` add index `stats_event_target_account_id_index`(`target_account_id`);');

    this.addSql('create table `app_state` (`id` varchar(255) not null, `value` json not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `app_state` add primary key `app_state_pkey`(`id`);');

    this.addSql('alter table `watchdog_state_node` add constraint `watchdog_state_node_owner_id_foreign` foreign key (`owner_id`) references `watchdog_user` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `watchdog_issue_node` add constraint `watchdog_issue_node_node_state_id_foreign` foreign key (`node_state_id`) references `watchdog_state_node` (`id`) on update cascade;');

    this.addSql('alter table `phala_stakepool` add constraint `phala_stakepool_owner_id_foreign` foreign key (`owner_id`) references `phala_account` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_issue_uworker` add constraint `watchdog_issue_uworker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `phala_stakepool` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_observation` add constraint `watchdog_observation_user_id_foreign` foreign key (`user_id`) references `watchdog_user` (`id`) on update cascade;');
    this.addSql('alter table `watchdog_observation` add constraint `watchdog_observation_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `phala_stakepool` (`id`) on update cascade;');
    this.addSql('alter table `watchdog_observation` add constraint `watchdog_observation_account_id_foreign` foreign key (`account_id`) references `phala_account` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `stats_stakepoolentry` add constraint `stats_stakepoolentry_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `phala_stakepool` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `stats_stakepoolentry` add constraint `stats_stakepoolentry_last_history_entry_id_foreign` foreign key (`last_history_entry_id`) references `stats_historyentry` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `stats_historyentry` add constraint `stats_historyentry_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stats_stakepoolentry` (`id`) on update cascade;');

    this.addSql('alter table `stats_worker` add constraint `stats_worker_operator_id_foreign` foreign key (`operator_id`) references `phala_account` (`id`) on update cascade;');
    this.addSql('alter table `stats_worker` add constraint `stats_worker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stats_stakepoolentry` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `stats_stakepoolentry_issues` add constraint `stats_stakepoolentry_issues_stake_pool_entry_id_foreign` foreign key (`stake_pool_entry_id`) references `stats_stakepoolentry` (`id`) on update cascade on delete cascade;');
    this.addSql('alter table `stats_stakepoolentry_issues` add constraint `stats_stakepoolentry_issues_issue_id_foreign` foreign key (`issue_id`) references `stats_issue` (`id`) on update cascade on delete cascade;');

    this.addSql('alter table `stats_event` add constraint `stats_event_stake_pool_entry_id_foreign` foreign key (`stake_pool_entry_id`) references `stats_stakepoolentry` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `stats_event` add constraint `stats_event_source_account_id_foreign` foreign key (`source_account_id`) references `phala_account` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `stats_event` add constraint `stats_event_target_account_id_foreign` foreign key (`target_account_id`) references `phala_account` (`id`) on update cascade on delete set null;');
  }

}
