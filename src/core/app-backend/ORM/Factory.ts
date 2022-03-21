import { MikroORM, Options } from '@mikro-orm/core';
import { Config } from '@inti5/configuration';
import { ReleaseSymbol } from '@inti5/object-manager';


export class OrmFactory
{

    @Config('service.orm')
    protected ormConfig : Options;

    public async create() : Promise<MikroORM>
    {
        const orm = await MikroORM.init(this.ormConfig);

        const migrator = orm.getMigrator();
        const migrations = await migrator.getPendingMigrations();
        if (migrations && migrations.length > 0) {
            console.warn(`There are pending migrations! (${ migrations.length })`);
        }

        // assign release procedure
        orm[ReleaseSymbol] = () => orm.close();

        return orm;
    }

}
