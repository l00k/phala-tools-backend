import { Migration } from '@mikro-orm/migrations';

export class Migration20220831215843 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_historyentry` drop foreign key `stats_historyentry_snapshot_nonce_id_foreign`;');

    this.addSql('alter table `stats_networkstate` drop index `stats_networkstate_entry_nonce_unique`;');
    this.addSql('alter table `stats_networkstate` CHANGE `entry_nonce` `snapshot_id` INT(11) unsigned NOT NULL;');
    this.addSql('alter table `stats_networkstate` drop `entry_date`;');

    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_snapshot_nonce_id_index`;');
    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_snapshot_nonce_id_index`;');
    this.addSql('alter table `stats_historyentry` change `snapshot_nonce_id` `snapshot_id` int unsigned not null;');
    this.addSql('alter table `stats_historyentry` add constraint `stats_historyentry_snapshot_id_foreign` foreign key (`snapshot_id`) references `stats_snapshot` (`id`) on update cascade;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_snapshot_id_index`(`snapshot_id`);');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_snapshot_id_index`(`stake_pool_entry_id`, `snapshot_id`);');
  }

  async down(): Promise<void> {
    this.addSql('alter table `stats_historyentry` drop foreign key `stats_historyentry_snapshot_id_foreign`;');

    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_snapshot_id_index`;');
    this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_snapshot_id_index`;');
    this.addSql('alter table `stats_historyentry` change `snapshot_id` `snapshot_nonce_id` int unsigned not null;');
    this.addSql('alter table `stats_historyentry` add constraint `stats_historyentry_snapshot_nonce_id_foreign` foreign key (`snapshot_nonce_id`) references `stats_snapshot` (`id`) on update cascade on delete restrict;');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_snapshot_nonce_id_index`(`snapshot_nonce_id`);');
    this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_snapshot_nonce_id_index`(`stake_pool_entry_id`, `snapshot_nonce_id`);');

    this.addSql('alter table `stats_networkstate` add `entry_nonce` int not null, add `entry_date` datetime not null;');
    this.addSql('alter table `stats_networkstate` add unique `stats_networkstate_entry_nonce_unique`(`entry_nonce`);');
  }

}
