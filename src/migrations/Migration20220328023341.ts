import { Migration } from '@mikro-orm/migrations';

export class Migration20220328023341 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `watchdog_account` add `identity` varchar(255) not null;');
  }

}
