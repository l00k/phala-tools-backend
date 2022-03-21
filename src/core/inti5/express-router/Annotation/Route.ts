import { ObjectManager } from '@inti5/object-manager';
import { getDecoratorTarget } from '@inti5/utils/getDecoratorTarget';
import { RouteDescription } from '../def';
import { Router } from '../Router';


function Route (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function Route (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;

function Route () : PropertyDecorator & ClassDecorator
{
    let options : Partial<RouteDescription> = {};
    
    if (arguments.length == 1) {
        if (typeof arguments[0] == 'string') {
            options.path = arguments[0];
        }
        else {
            options = arguments[0];
        }
    }
    else {
        options = {
            ...arguments[1],
            ...arguments[2],
        };
        options.path = arguments[0];
    }
    
    return function(Target : any, method? : string | symbol) : void {
        const [ TargetConstructor, TargetPrototype ] = getDecoratorTarget(Target);
        const router = ObjectManager.getSingleton()
            .getInstance(Router);
        
        if (!method) {
            router.registerBaseRoute(<any> TargetConstructor, options);
        }
        else {
            const method : string = arguments[1];
            if (options.path === undefined) {
                options.path = method;
            }
            
            router.registerRoute(<any> TargetConstructor, method, {
                actionMethod: method,
                ...options
            });
        }
    };
}


function GET (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function GET (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function GET () {
    return Route(...arguments, { requestMethod: 'GET' });
};
Route.GET = GET;


function PUT (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function PUT (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function PUT (...args : any[]) {
    return Route(...arguments, { requestMethod: 'PUT' });
};
Route.PUT = PUT;


function POST (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function POST (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function POST (...args : any[]) {
    return Route(...arguments, { requestMethod: 'POST' });
};
Route.POST = POST;


function PATCH (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function PATCH (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function PATCH (...args : any[]) {
    return Route(...arguments, { requestMethod: 'PATCH' });
};
Route.PATCH = PATCH;


function DELETE (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function DELETE (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function DELETE (...args : any[]) {
    return Route(...arguments, { requestMethod: 'DELETE' });
};
Route.DELETE = DELETE;


function PlainText (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function PlainText (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function PlainText (...args : any[]) {
    return Route(...arguments, { contentType: 'plain/text' });
};
Route.PlainText = PlainText;


function JSON (path? : string, options? : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function JSON (options : Partial<RouteDescription>) : PropertyDecorator & ClassDecorator;
function JSON (...args : any[]) {
    return Route(...arguments, { contentType: 'application/json' });
};
Route.JSON = JSON;


export { Route };
