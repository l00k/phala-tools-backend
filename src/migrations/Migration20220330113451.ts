import { Migration } from '@mikro-orm/migrations';

export class Migration20220330113451 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `stats_stakepool_issue` (`id` int unsigned not null auto_increment primary key, `name` varchar(255) not null, `description` varchar(255) not null, `color` varchar(255) not null) default character set utf8mb4 engine = InnoDB;');

    this.addSql('create table `stats_account` (`id` int unsigned not null auto_increment primary key, `address` varchar(255) not null, `identity` varchar(255) null, `created_at` datetime not null, `updated_at` datetime not null, `identity_verified` tinyint(1) not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_account` add unique `stats_account_address_unique`(`address`);');

    this.addSql('create table `stake_pool` (`id` int unsigned not null auto_increment primary key, `on_chain_id` int(11) null, `owner_id` int(11) unsigned not null, `special` varchar(255) null, `last_history_entry_id` int(11) unsigned null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stake_pool` add index `stake_pool_owner_id_index`(`owner_id`);');
    this.addSql('alter table `stake_pool` add index `stake_pool_last_history_entry_id_index`(`last_history_entry_id`);');
    this.addSql('alter table `stake_pool` add unique `stake_pool_last_history_entry_id_unique`(`last_history_entry_id`);');

    this.addSql('create table `stats_event` (`id` int unsigned not null auto_increment primary key, `block_number` int(11) not null, `block_date` datetime not null, `type` enum(\'transfer\', \'poolCreated\', \'commissionChange\', \'contribution\', \'withdrawal\', \'slash\', \'halving\', \'badBehavior\') not null, `stake_pool_id` int(11) unsigned null, `source_account_id` int(11) unsigned null, `target_account_id` int(11) unsigned null, `amount` DECIMAL(18,4) null, `additional_data` json not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_event` add index `stats_event_block_number_index`(`block_number`);');
    this.addSql('alter table `stats_event` add index `stats_event_type_index`(`type`);');
    this.addSql('alter table `stats_event` add index `stats_event_stake_pool_id_index`(`stake_pool_id`);');
    this.addSql('alter table `stats_event` add index `stats_event_source_account_id_index`(`source_account_id`);');
    this.addSql('alter table `stats_event` add index `stats_event_target_account_id_index`(`target_account_id`);');

    this.addSql('create table `stats_stakepool_historyentry` (`id` int unsigned not null auto_increment primary key, `stake_pool_id` int(11) unsigned not null, `entry_nonce` int(11) not null, `entry_date` datetime not null, `commission` DECIMAL(12,7) not null, `workers_num` int(11) not null, `workers_active_num` int(11) not null, `stake_total` DECIMAL(18,4) not null, `cap` DECIMAL(18,4) not null, `stake_free` DECIMAL(18,4) not null, `stake_releasing` DECIMAL(18,4) not null, `stake_remaining` DECIMAL(18,4) not null, `withdrawals` DECIMAL(18,4) not null, `v_total` DECIMAL(24,6) not null, `p_total` int(11) unsigned not null, `rewards_total` DECIMAL(18,4) not null, `current_rewards_daily` DECIMAL(18,4) not null, `current_apr` DECIMAL(12,7) not null, `avg_rewards_daily` DECIMAL(18,4) not null, `avg_apr` DECIMAL(12,7) null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_stakepool_historyentry` add index `stats_stakepool_historyentry_stake_pool_id_index`(`stake_pool_id`);');
    this.addSql('alter table `stats_stakepool_historyentry` add index `stats_stakepool_historyentry_entry_nonce_index`(`entry_nonce`);');

    this.addSql('alter table `watchdog_issue_uworker` drop foreign key `watchdog_issue_uworker_stake_pool_id_foreign`;');
    this.addSql('alter table `watchdog_issue_uworker` drop index `watchdog_issue_uworker_stake_pool_id_index`;');
    this.addSql('alter table `watchdog_issue_uworker` add constraint `watchdog_issue_uworker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stake_pool` (`id`) on update cascade;');

    this.addSql('create table `stake_pool_issues` (`stake_pool_id` int(11) unsigned not null, `issue_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stake_pool_issues` add index `stake_pool_issues_stake_pool_id_index`(`stake_pool_id`);');
    this.addSql('alter table `stake_pool_issues` add index `stake_pool_issues_issue_id_index`(`issue_id`);');
    this.addSql('alter table `stake_pool_issues` add primary key `stake_pool_issues_pkey`(`stake_pool_id`, `issue_id`);');

    this.addSql('create table `stats_worker` (`id` int unsigned not null auto_increment primary key, `public_key` varchar(255) not null, `binding_account` varchar(255) null, `operator_id` int(11) unsigned not null, `stake_pool_id` int(11) unsigned null, `initial_score` int(11) unsigned not null, `confidence_level` int(11) unsigned not null, `state` enum(\'NotReady\', \'Ready\', \'MiningIdle\', \'MiningActive\', \'MiningUnresponsive\', \'MiningCoolingDown\') not null, `ve` DECIMAL(24,6) not null, `v` DECIMAL(24,6) not null, `p_init` int(11) unsigned not null, `p_instant` int(11) unsigned not null, `total_rewards` DECIMAL(18,4) not null, `updated_at` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `stats_worker` add index `stats_worker_operator_id_index`(`operator_id`);');
    this.addSql('alter table `stats_worker` add index `stats_worker_stake_pool_id_index`(`stake_pool_id`);');

    this.addSql('alter table `watchdog_stakepool_observation` drop foreign key `watchdog_stakepool_observation_stake_pool_id_foreign`;');
    this.addSql('alter table `watchdog_stakepool_observation` drop index `watchdog_stakepool_observation_stake_pool_id_index`;');
    this.addSql('alter table `watchdog_stakepool_observation` add constraint `watchdog_stakepool_observation_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stake_pool` (`id`) on update cascade;');
    this.addSql('alter table `watchdog_stakepool_observation` drop foreign key `watchdog_stakepool_observation_account_id_foreign`;');
    this.addSql('alter table `watchdog_stakepool_observation` drop index `watchdog_stakepool_observation_account_id_index`;');
    this.addSql('alter table `watchdog_stakepool_observation` add constraint `watchdog_stakepool_observation_account_id_foreign` foreign key (`account_id`) references `stats_account` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `watchdog_user_accounts` drop foreign key `watchdog_user_accounts_account_id_foreign`;');
    this.addSql('alter table `watchdog_user_accounts` drop index `watchdog_user_accounts_account_id_index`;');
    this.addSql('alter table `watchdog_user_accounts` add constraint `watchdog_user_accounts_account_id_foreign` foreign key (`account_id`) references `stats_account` (`id`) on update cascade on delete cascade;');

    this.addSql('alter table `stake_pool` add constraint `stake_pool_owner_id_foreign` foreign key (`owner_id`) references `stats_account` (`id`) on update cascade;');
    this.addSql('alter table `stake_pool` add constraint `stake_pool_last_history_entry_id_foreign` foreign key (`last_history_entry_id`) references `stats_stakepool_historyentry` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `stats_event` add constraint `stats_event_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stake_pool` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `stats_event` add constraint `stats_event_source_account_id_foreign` foreign key (`source_account_id`) references `stats_account` (`id`) on update cascade on delete set null;');
    this.addSql('alter table `stats_event` add constraint `stats_event_target_account_id_foreign` foreign key (`target_account_id`) references `stats_account` (`id`) on update cascade on delete set null;');

    this.addSql('alter table `stats_stakepool_historyentry` add constraint `stats_stakepool_historyentry_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stake_pool` (`id`) on update cascade;');

    this.addSql('alter table `stake_pool_issues` add constraint `stake_pool_issues_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stake_pool` (`id`) on update cascade on delete cascade;');
    this.addSql('alter table `stake_pool_issues` add constraint `stake_pool_issues_issue_id_foreign` foreign key (`issue_id`) references `stats_stakepool_issue` (`id`) on update cascade on delete cascade;');

    this.addSql('alter table `stats_worker` add constraint `stats_worker_operator_id_foreign` foreign key (`operator_id`) references `stats_account` (`id`) on update cascade;');
    this.addSql('alter table `stats_worker` add constraint `stats_worker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `stake_pool` (`id`) on update cascade on delete set null;');

    this.addSql('drop table if exists `phala_account`;');

    this.addSql('drop table if exists `phala_stakepool`;');

    this.addSql('drop table if exists `phala_worker`;');
  }

}
