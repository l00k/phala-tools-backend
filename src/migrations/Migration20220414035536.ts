import { Migration } from '@mikro-orm/migrations';

export class Migration20220414035536 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `watchdog_issue_stucked_node` (`id` int unsigned not null auto_increment primary key, `occurrence_date` datetime not null, `node_state_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_issue_stucked_node` add index `watchdog_issue_stucked_node_node_state_id_index`(`node_state_id`);');
    this.addSql('alter table `watchdog_issue_stucked_node` add unique `watchdog_issue_stucked_node_node_state_id_unique`(`node_state_id`);');

    this.addSql('alter table `stats_historyentry` modify `stake_pool_entry_id` int(11) unsigned not null;');
    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_index`;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_index`(`stake_pool_entry_id`);');

    this.addSql('create table `watchdog_issue_unresp_worker` (`id` int unsigned not null auto_increment primary key, `occurrence_date` datetime not null, `worker_account` varchar(255) not null, `worker_pub_key` varchar(255) not null, `stake_pool_id` int(11) unsigned not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `watchdog_issue_unresp_worker` add index `watchdog_issue_unresp_worker_stake_pool_id_index`(`stake_pool_id`);');

    this.addSql('alter table `watchdog_issue_stucked_node` add constraint `watchdog_issue_stucked_node_node_state_id_foreign` foreign key (`node_state_id`) references `watchdog_state_node` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_issue_unresp_worker` add constraint `watchdog_issue_unresp_worker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `phala_stakepool` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_issue_unresp_worker` add unique `watchdog_issue_unresp_worker_worker_account_worker__d6d2c_unique`(`worker_account`, `worker_pub_key`, `stake_pool_id`);');

    this.addSql('drop table if exists `watchdog_issue_node`;');

    this.addSql('drop table if exists `watchdog_issue_uworker`;');
  }

}
