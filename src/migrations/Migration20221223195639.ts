import { Migration } from '@mikro-orm/migrations';

export class Migration20221223195639 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `phala_account` modify `identity_verified` tinyint(1) not null default false;');

    this.addSql('alter table `stats_networkstate` modify `total_shares` double not null default 0, modify `pha_price` float not null default 0;');

    this.addSql('alter table `stats_historyentry` modify `commission` float not null default 0, modify `workers_num` int not null default 0, modify `workers_active_num` int not null default 0, modify `stake_total` double not null default 0, modify `cap` double not null default 0, modify `stake_free` double not null default 0, modify `stake_releasing` double not null default 0, modify `withdrawals` double not null default 0, modify `current_apr` float not null default 0, modify `intermediate_step` int not null default 0, modify `finalized` tinyint(1) not null default false;');

    this.addSql('alter table `stats_event` modify `amount` double default 0;');

    this.addSql('alter table `watchdog_state_node` modify `primary` tinyint(1) not null default false;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `phala_account` modify `identity_verified` tinyint(1) not null;');

    this.addSql('alter table `stats_event` modify `amount` double;');

    this.addSql('alter table `stats_historyentry` modify `finalized` tinyint(1) not null, modify `intermediate_step` int not null, modify `commission` float not null, modify `workers_num` int not null, modify `workers_active_num` int not null, modify `stake_total` double not null, modify `cap` double not null, modify `stake_free` double not null, modify `stake_releasing` double not null, modify `withdrawals` double not null, modify `current_apr` float not null;');

    this.addSql('alter table `stats_networkstate` modify `total_shares` double not null, modify `pha_price` float not null;');

    this.addSql('alter table `watchdog_state_node` modify `primary` tinyint(1) not null;');
  }

}
