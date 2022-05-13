import { Migration } from '@mikro-orm/migrations';

export class Migration20220513092254 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` add `finalized` tinyint(1) not null;');
  }

}
