import { Migration } from '@mikro-orm/migrations';

export class Migration20220831214412
    extends Migration
{
    
    async up () : Promise<void>
    {
        this.addSql('alter table `stats_stakepoolentry` drop index `stats_stakepoolentry_stake_pool_id_index`;');
        this.addSql('alter table `stats_stakepoolentry` drop index `stats_stakepoolentry_last_history_entry_id_index`;');
        
        this.addSql(`
            DELETE FROM \`stats_networkstate\` WHERE \`entry_nonce\` % 4 != 3
        `);
        this.addSql(`
            UPDATE stats_networkstate
            SET entry_nonce = 1 + FLOOR(entry_nonce / 4)
            ORDER BY entry_nonce
        `);
        
        this.addSql(`
            DELETE FROM \`stats_historyentry\` WHERE \`entry_nonce\` % 4 != 3
        `);
        this.addSql(`
            UPDATE stats_historyentry
            SET entry_nonce = 1 + FLOOR(entry_nonce / 4)
            ORDER BY entry_nonce
        `);
        
        this.addSql(`
            INSERT INTO \`stats_snapshot\`(\`id\`, \`date\`)
            SELECT \`entry_nonce\`, \`entry_date\`
            FROM \`stats_historyentry\`
            WHERE \`stake_pool_entry_id\` = 3
        `);
        
        this.addSql('alter table `stats_historyentry` CHANGE `entry_nonce` `snapshot_nonce_id` INT(11) unsigned NOT NULL;');
        this.addSql('alter table `stats_historyentry` modify `stake_pool_entry_id` int unsigned not null;');
        
        this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_entry_nonce_index`;');
        this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_entry_nonce_f_4847b_index`;');
        this.addSql('alter table `stats_historyentry` drop index `stats_historyentry_stake_pool_entry_id_entry_nonce_index`;');
        this.addSql('alter table `stats_historyentry` add constraint `stats_historyentry_snapshot_nonce_id_foreign` foreign key (`snapshot_nonce_id`) references `stats_snapshot` (`id`) on update cascade;');
        this.addSql('alter table `stats_historyentry` drop `entry_date`;');
        this.addSql('alter table `stats_historyentry` add constraint `stats_historyentry_stake_pool_entry_id_foreign` foreign key (`stake_pool_entry_id`) references `stats_stakepoolentry` (`id`) on update cascade;');
        this.addSql('alter table `stats_historyentry` add index `stats_historyentry_snapshot_nonce_id_index`(`snapshot_nonce_id`);');
        this.addSql('alter table `stats_historyentry` add index `stats_historyentry_stake_pool_entry_id_snapshot_nonce_id_index`(`stake_pool_entry_id`, `snapshot_nonce_id`);');
        
        this.addSql('alter table `stats_event` modify `type` varchar(255) not null;');
    }
    
    async down () : Promise<void>
    {
    }
    
}
