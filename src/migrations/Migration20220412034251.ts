import { Migration } from '@mikro-orm/migrations';

export class Migration20220412034251 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` modify `stake_pool_entry_id` int(11) unsigned not null, modify `stake_remaining` DECIMAL(18,4) null;');
    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_index`;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_index`(`stake_pool_entry_id`);');
  }

}
