import { Exception, ExceptionMetadata } from '@inti5/utils/Exception';

/* istanbul ignore next */
export class MappingException
    extends Exception
{

    public name : string = 'MappingException';

    public metadata : ExceptionMetadata = {
        responseCode: 406 // not acceptable
    };

}
