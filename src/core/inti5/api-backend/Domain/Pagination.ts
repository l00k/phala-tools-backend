export class Pagination
{
    
    public page : number = 1;
    
    public itemsPerPage : number = 25;
    
    public get offset () : number
    {
        return (this.page - 1) * this.itemsPerPage;
    }
    
}
