import { Migration } from '@mikro-orm/migrations';

export class Migration20220901002056 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table `stats_snapshot` add `block_hash` varchar(255) not null;');
  }

}
