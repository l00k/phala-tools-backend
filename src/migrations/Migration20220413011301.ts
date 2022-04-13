import { Migration } from '@mikro-orm/migrations';

export class Migration20220413011301 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` modify `stake_pool_entry_id` int(11) unsigned;');
    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_index`;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_index`(`stake_pool_entry_id`);');

    this.addSql('alter table `watchdog_issue_uworker` drop index `watchdog_issue_uworker_worker_account_unique`;');

    this.addSql('alter table `watchdog_issue_uworker` drop index `watchdog_issue_uworker_worker_pub_key_unique`;');

    this.addSql('alter table `watchdog_issue_uworker` add unique `watchdog_issue_uworker_worker_account_worker_pub_ke_5138e_unique`(`worker_account`, `worker_pub_key`, `stake_pool_id`);');
  }

}
