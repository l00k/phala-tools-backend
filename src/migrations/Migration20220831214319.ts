import { Migration } from '@mikro-orm/migrations';

export class Migration20220831214319 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `stats_snapshot` (`id` int unsigned not null auto_increment primary key, `date` datetime not null) default character set utf8mb4 engine = InnoDB;');

    this.addSql('alter table `watchdog_issue_unresp_worker` drop index `watchdog_issue_unresp_worker_worker_account_worker__d6d2c_unique`;');
    this.addSql('alter table `watchdog_issue_unresp_worker` add unique `watchdog_issue_unresp_worker_worker_account_worker_d6d2c_unique`(`worker_account`, `worker_pub_key`, `stake_pool_id`);');

    this.addSql('alter table `watchdog_issue_stucked_node` drop index `watchdog_issue_stucked_node_node_state_id_index`;');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `stats_snapshot`;');

    this.addSql('alter table `watchdog_issue_stucked_node` add index `watchdog_issue_stucked_node_node_state_id_index`(`node_state_id`);');

    this.addSql('alter table `watchdog_issue_unresp_worker` drop index `watchdog_issue_unresp_worker_worker_account_worker_d6d2c_unique`;');
    this.addSql('alter table `watchdog_issue_unresp_worker` add unique `watchdog_issue_unresp_worker_worker_account_worker__d6d2c_unique`(`worker_account`, `worker_pub_key`, `stake_pool_id`);');
  }

}
