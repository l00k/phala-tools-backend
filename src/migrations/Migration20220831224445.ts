import { Migration } from '@mikro-orm/migrations';

export class Migration20220831224445 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_snapshot` modify `block_number` int unsigned not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table `stats_snapshot` modify `block_number` int not null;');
  }

}
