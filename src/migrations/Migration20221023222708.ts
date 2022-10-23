import { Migration } from '@mikro-orm/migrations';

export class Migration20221023222708 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` add `finalized` tinyint(1) not null;');
    this.addSql('update `stats_historyentry` set `finalized` = 1');
  }

  async down(): Promise<void> {
    this.addSql('alter table `stats_historyentry` drop `finalized`;');
  }

}
