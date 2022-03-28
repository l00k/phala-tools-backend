import { Migration } from '@mikro-orm/migrations';

export class Migration20220328023415 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `watchdog_account` modify `identity` varchar(255) null;');
  }

}
