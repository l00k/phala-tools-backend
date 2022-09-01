import { Migration } from '@mikro-orm/migrations';

export class Migration20220831220310 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_networkstate` add constraint `stats_networkstate_snapshot_id_foreign` foreign key (`snapshot_id`) references `stats_snapshot` (`id`) on update cascade;');
    this.addSql('alter table `stats_networkstate` add unique `stats_networkstate_snapshot_id_unique`(`snapshot_id`);');
    this.addSql(`
    
    `);
  }

  async down(): Promise<void> {
    this.addSql('alter table `stats_networkstate` drop foreign key `stats_networkstate_snapshot_id_foreign`;');

    this.addSql('alter table `stats_networkstate` drop index `stats_networkstate_snapshot_id_unique`;');
  }

}
