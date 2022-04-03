export class Filters
{
    
    public $and : any[];
    
    public set _owner (filter : any)
    {
        if (!this.$and) {
            this.$and = [];
        }
        if (!this.$and[0]) {
            this.$and[0] = { $or: [] };
        }
        
        this.$and[0].$or.push({ stakePool: { owner: { address: filter } } });
        this.$and[0].$or.push({ stakePool: { owner: { identity: filter } } });
    }
    
    public set _issues (filter : any)
    {
        if (!this.$and) {
            this.$and = [];
        }
        if (!this.$and[1]) {
            this.$and[1] = { $or: [] };
        }
        
        this.$and[1].$or.push({ issues: { id: { $eq: null } } });
        this.$and[1].$or.push({ issues: filter });
    }
    
}
