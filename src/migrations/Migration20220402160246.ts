import { Migration } from '@mikro-orm/migrations';

export class Migration20220402160246 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` change `stake_pool_id` `stake_pool_entry_id` int(11) unsigned not null;');
  }

}
