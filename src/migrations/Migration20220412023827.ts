import { Migration } from '@mikro-orm/migrations';

export class Migration20220412023827 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` modify `stake_pool_entry_id` int(11) unsigned;');
    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_index`;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_index`(`stake_pool_entry_id`);');

    this.addSql('alter table `stats_networkstate` drop index `stats_networkstate_entry_nonce_index`;');

    this.addSql('alter table `stats_networkstate` add unique `stats_networkstate_entry_nonce_unique`(`entry_nonce`);');
  }

}
