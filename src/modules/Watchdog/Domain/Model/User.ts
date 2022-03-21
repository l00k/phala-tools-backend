import * as ORM from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { AbstractModel } from '@inti5/app-backend/Module/AbstractModel';
import { StakePoolObservation } from '#/Watchdog/Domain/Model/StakePoolObservation';
import { Account } from '#/Watchdog/Domain/Model/Account';
import { UserConfiguration } from '#/Watchdog/Domain/Model/UserConfiguration';
import * as Trans from 'class-transformer';


@ORM.Entity({
    tableName: 'watchdog_user'
})
export class User
    extends AbstractModel<User>
{

    public static readonly MAX_NODE_COUNT = 3;

    
    @ORM.PrimaryKey()
    public id : number;
    
    @ORM.Property({ unique: true })
    public tgUserId : string;
    
    @ORM.Property()
    public tgName : string;
    
    @ORM.Property({ onCreate: () => new Date() })
    public createdAt : Date = new Date();
    
    @ORM.Property({ onUpdate: () => new Date() })
    public updatedAt : Date = new Date();
    
    
    @ORM.Property({ type: ORM.JsonType })
    public config : UserConfiguration = new UserConfiguration();
    
    @ORM.ManyToMany(() => Account)
    public accounts : ORM.Collection<Account>;
    
    @ORM.OneToMany(() => StakePoolObservation, o => o.user)
    public stakePoolObservations : ORM.Collection<StakePoolObservation>;
    
    
    public constructor (data? : Partial<User>, entityManager? : EntityManager)
    {
        super(data, entityManager);
        
        this.accounts = new ORM.Collection<Account>(this, []);
        this.stakePoolObservations = new ORM.Collection<StakePoolObservation>(this, []);
        
        if (data) {
            this.assign(data, { em: entityManager });
        }
    }
    
    public getConfig <K extends keyof UserConfiguration>(key : K) : UserConfiguration[K]
    {
        if (this.config[key] === undefined) {
            this.config = Trans.plainToClassFromExist(new UserConfiguration(), this.config);
        }
        
        return this.config[key];
    }
    
}
