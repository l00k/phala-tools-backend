import { Migration } from '@mikro-orm/migrations';

export class Migration20220831222605 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_networkstate` modify `total_shares` double not null;');

    this.addSql('alter table `stats_historyentry` modify `commission` float not null, modify `stake_total` double not null, modify `cap` double not null, modify `stake_free` double not null, modify `stake_releasing` double not null, modify `stake_remaining` double, modify `withdrawals` double not null, modify `current_apr` float not null, modify `avg_apr` float;');

    this.addSql('alter table `stats_event` modify `amount` double;');

    this.addSql('alter table `stats_worker` modify `ve` double not null, modify `v` double not null, modify `total_rewards` double not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `stats_event` modify `amount` decimal(18,4);');

    this.addSql('alter table `stats_historyentry` modify `commission` decimal(12,7) not null, modify `stake_total` decimal(18,4) not null, modify `cap` decimal(18,4) not null, modify `stake_free` decimal(18,4) not null, modify `stake_releasing` decimal(18,4) not null, modify `stake_remaining` decimal(18,4), modify `withdrawals` decimal(18,4) not null, modify `current_apr` decimal(12,7) not null, modify `avg_apr` decimal(12,7);');

    this.addSql('alter table `stats_networkstate` modify `total_shares` decimal(24,6) not null;');

    this.addSql('alter table `stats_worker` modify `ve` decimal(24,6) not null, modify `v` decimal(24,6) not null, modify `total_rewards` decimal(18,4) not null;');
  }

}
