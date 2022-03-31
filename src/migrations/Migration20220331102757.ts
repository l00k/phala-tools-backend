import { Migration } from '@mikro-orm/migrations';

export class Migration20220331102757 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `watchdog_issue_uworker` drop foreign key `watchdog_issue_uworker_stake_pool_id_foreign`;');
    this.addSql('alter table `watchdog_issue_uworker` drop index `watchdog_issue_uworker_stake_pool_id_index`;');
    this.addSql('alter table `watchdog_issue_uworker` add constraint `watchdog_issue_uworker_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `phala_stakepool` (`id`) on update cascade;');

    this.addSql('alter table `watchdog_stakepool_observation` drop foreign key `watchdog_stakepool_observation_stake_pool_id_foreign`;');
    this.addSql('alter table `watchdog_stakepool_observation` drop index `watchdog_stakepool_observation_stake_pool_id_index`;');
    this.addSql('alter table `watchdog_stakepool_observation` add constraint `watchdog_stakepool_observation_stake_pool_id_foreign` foreign key (`stake_pool_id`) references `phala_stakepool` (`id`) on update cascade;');
    this.addSql('alter table `watchdog_stakepool_observation` drop foreign key `watchdog_stakepool_observation_account_id_foreign`;');
    this.addSql('alter table `watchdog_stakepool_observation` drop index `watchdog_stakepool_observation_account_id_index`;');
    this.addSql('alter table `watchdog_stakepool_observation` add constraint `watchdog_stakepool_observation_account_id_foreign` foreign key (`account_id`) references `phala_account` (`id`) on update cascade on delete set null;');

    this.addSql('drop table if exists `watchdog_account`;');

    this.addSql('drop table if exists `watchdog_stakepool`;');

    this.addSql('drop table if exists `watchdog_user_accounts`;');
  }

}
