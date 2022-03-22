import { Migration } from '@mikro-orm/migrations';

export class Migration20220322225635 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `watchdog_user` change `name` `username` varchar(255) not null;');


    this.addSql('alter table `watchdog_user` add `token` varchar(255) null;');

    this.addSql('alter table `watchdog_stakepool_observation` add `config` json not null;');

    this.addSql('alter table `watchdog_user` add index `watchdog_user_user_id_index`(`user_id`);');
  }

}
