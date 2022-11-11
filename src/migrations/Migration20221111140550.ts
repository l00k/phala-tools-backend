import { Migration } from '@mikro-orm/migrations';

export class Migration20221111140550 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_networkstate` add `pha_price` float not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `stats_networkstate` drop `pha_price`;');
  }

}
