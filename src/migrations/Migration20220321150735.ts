import { Migration } from '@mikro-orm/migrations';

export class Migration20220321150735 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `watchdog_stakepool_observation` modify `account_id` int(11) unsigned null;');
  }

}
