import { Migration } from '@mikro-orm/migrations';

export class Migration20220322230355 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `watchdog_user` change `messaging_channel` `msg_channel` enum not null;');


    this.addSql('alter table `watchdog_user` change `user_id` `msg_user_id` varchar(255) not null;');


    this.addSql('alter table `watchdog_user` drop index `watchdog_user_messaging_channel_user_id_unique`;');

    this.addSql('alter table `watchdog_user` drop index `watchdog_user_user_id_index`;');

    this.addSql('alter table `watchdog_user` add unique `watchdog_user_msg_channel_msg_user_id_unique`(`msg_channel`, `msg_user_id`);');

    this.addSql('alter table `watchdog_user` add index `watchdog_user_msg_user_id_index`(`msg_user_id`);');
  }

}
