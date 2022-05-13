import { Migration } from '@mikro-orm/migrations';

export class Migration20220513102209 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_entry_nonce_f_4847b_index`(`stake_pool_entry_id`, `entry_nonce`, `finalized`);');
  }

}
