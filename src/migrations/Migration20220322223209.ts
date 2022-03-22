import { Migration } from '@mikro-orm/migrations';

export class Migration20220322223209 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `watchdog_user` drop `chat_id`;');

    this.addSql('alter table `watchdog_stakepool_observation` add `config` json not null;');

    this.addSql('alter table `watchdog_user` add index `watchdog_user_user_id_index`(`user_id`);');
  }

}
