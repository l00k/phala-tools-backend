import * as Trans from 'class-transformer';


@Trans.Exclude()
export class Pagination
{

    @Trans.Expose()
    @Trans.Type()
    public page : number = 1;

    @Trans.Expose()
    @Trans.Type()
    public itemsPerPage : number = 25;

    public itemsPerPageOptions : number[] = [ 25, 50, 100 ];
    
    public total : number = 0;
    
    
    public constructor (
        itemsPerPageOptions : number[] = [ 25, 50, 100 ],
        defaultItemsPerPage? : number
    ) {
        this.itemsPerPageOptions = itemsPerPageOptions;
        this.itemsPerPage = defaultItemsPerPage ?? itemsPerPageOptions[0];
    }

}
