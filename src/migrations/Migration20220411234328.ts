import { Migration } from '@mikro-orm/migrations';

export class Migration20220411234328 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` modify `stake_pool_entry_id` int(11) unsigned not null;');
    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_index`;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_index`(`stake_pool_entry_id`);');

    this.addSql('drop table if exists `watchdog_account`;');

    this.addSql('drop table if exists `watchdog_stakepool`;');

    this.addSql('drop table if exists `watchdog_stakepool_observation`;');

    this.addSql('drop table if exists `watchdog_user_accounts`;');
  }

}
