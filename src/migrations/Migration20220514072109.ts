import { Migration } from '@mikro-orm/migrations';

export class Migration20220514072109 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` add `intermediate_step` int(11) not null;');
  }

}
