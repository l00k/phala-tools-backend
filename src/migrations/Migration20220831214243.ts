import { Migration } from '@mikro-orm/migrations';

export class Migration20220831214243 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table `admin` (`id` int unsigned not null auto_increment primary key, `username` varchar(255) not null, `password` varchar(255) not null, `last_login_at` datetime not null) default character set utf8mb4 engine = InnoDB;');
    this.addSql('alter table `admin` add unique `admin_username_unique`(`username`);');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists `admin`;');
  }

}
