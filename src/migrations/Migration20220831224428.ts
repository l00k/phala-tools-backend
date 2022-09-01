import { Migration } from '@mikro-orm/migrations';

export class Migration20220831224428 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_snapshot` add `block_number` int not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `stats_snapshot` drop `block_number`;');
  }

}
