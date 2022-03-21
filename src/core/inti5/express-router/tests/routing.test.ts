import { ObjectManager } from '@inti5/object-manager';
import { Exception } from '@inti5/utils/Exception';
import { ValidationException } from '@inti5/validator';
import { Router, ActionResult, Middleware, Route } from '../index';

describe('Router', () => {
    let router : Router;
    let expressApp : any;
    let response : any;
    
    beforeEach(() => {
        ObjectManager.getSingleton().releaseAll();
        router = ObjectManager.getSingleton().getInstance(Router);
        
        (<any>router).logger = {
            log: jest.fn(),
            error: jest.fn(),
        };
        expressApp = {
            get: jest.fn(),
            put: jest.fn(),
            post: jest.fn(),
            patch: jest.fn(),
            delete: jest.fn(),
        };
        response = {
            contentType: jest.fn(),
            status: jest.fn(),
            json: jest.fn(),
            send: jest.fn(),
            end: jest.fn(),
        };
    });
    
    test('Route registration and binding', () => {
        @Route.JSON('default')
        class DefaultController
        {
        
        }
        
        @Route.JSON('base')
        class MainController
        {
            
            @Route.GET('index')
            @Route.PlainText()
            public index ()
            {
            }
            
            @Route.PUT()
            public create ()
            {
            }
            
            @Route.POST({ path: 'update' })
            public update ()
            {
            }
            
            @Route.PATCH()
            public patch ()
            {
            }
            
            @Route.DELETE('delete')
            public delete ()
            {
            }
            
        }
        
        router.bindExpress(<any>expressApp);
        
        expect(expressApp.get)
            .toBeCalledTimes(1);
        expect(expressApp.put)
            .toBeCalledTimes(1);
        expect(expressApp.post)
            .toBeCalledTimes(1);
        expect(expressApp.patch)
            .toBeCalledTimes(1);
        expect(expressApp.delete)
            .toBeCalledTimes(1);
    });
    
    test('Route execution', async() => {
        const spy = jest.fn();
        
        @Route.JSON('base')
        class Controller
        {
            
            @Route('')
            @Route.PlainText()
            public index ()
            {
                spy('index', ...arguments);
            }
            
            @Route.PUT()
            public create ()
            {
                spy('create', ...arguments);
            }
            
            @Route.POST()
            public update ()
            {
                spy('update', ...arguments);
            }
            
            @Route.PATCH()
            public patch ()
            {
                spy('patch', ...arguments);
            }
            
            @Route.DELETE('delete')
            public delete ()
            {
                spy('delete', ...arguments);
            }
            
        }
        
        const controller = new Controller();
        
        {
            await (<any>router).handleRequest(
                controller,
                { requestMethod: 'POST', actionMethod: 'index' },
                {},
                response
            );
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy.mock.calls[0][0]).toStrictEqual('index');
            expect(spy.mock.calls[0][1]).toStrictEqual({});
            expect(spy.mock.calls[0][2]).toStrictEqual(response);
        }
        
        {
            const request = { params: { a: 1, b: 1 }, query: { a: 2, c: 2 }, body: 'ok' };
            await (<any>router).handleRequest(
                controller,
                { requestMethod: 'POST', actionMethod: 'update' },
                request,
                response
            );
            expect(spy).toHaveBeenCalledTimes(2);
            expect(spy.mock.calls[1][0]).toStrictEqual('update');
            expect(spy.mock.calls[1][1]).toStrictEqual(request);
            expect(spy.mock.calls[1][2]).toStrictEqual(response);
        }
        
        {
            const request = { params: { sample: 1 }, body: 'ok' };
            await (<any>router).handleRequest(
                controller,
                { requestMethod: 'POST', actionMethod: 'update' },
                request,
                response
            );
            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy.mock.calls[2][0]).toStrictEqual('update');
            expect(spy.mock.calls[2][1]).toStrictEqual(request);
            expect(spy.mock.calls[2][2]).toStrictEqual(response);
        }
    });
    
    test('Special responses (withContentTypeHeader)', async() => {
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            @Route.JSON()
            public withContentTypeHeader ()
            {
            }
            
        }
        
        const controller = new Controller();
        
        await (<any>router).handleRequest(
            controller,
            {
                requestMethod: 'GET',
                actionMethod: 'withContentTypeHeader',
                contentType: 'application/json'
            },
            {},
            response
        );
        
        expect(response.contentType)
            .toBeCalledWith('application/json');
    });
    
    test('Special responses (withActionResult)', async() => {
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            public withActionResult ()
            {
                return new ActionResult('ok', 201);
            }
            
        }
        
        const controller = new Controller();
        
        await (<any>router).handleRequest(
            controller,
            { requestMethod: 'GET', actionMethod: 'withActionResult' },
            {},
            response
        );
        
        expect(response.status)
            .toHaveBeenCalledTimes(1)
            .toHaveBeenLastCalledWith(201);
        
        expect(response.json)
            .toBeCalledTimes(1)
            .toHaveBeenLastCalledWith('ok');
    });
    
    test('Special responses (withSimpleResult)', async() => {
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            public withSimpleResult ()
            {
                return 'ok';
            }
            
        }
        
        const controller = new Controller();
        
        await (<any>router).handleRequest(
            controller,
            { requestMethod: 'GET', actionMethod: 'withSimpleResult' },
            {},
            response
        );
        
        expect(response.status)
            .toHaveBeenCalledTimes(1)
            .toHaveBeenLastCalledWith(200);
        
        expect(response.json)
            .toBeCalledTimes(1)
            .toHaveBeenLastCalledWith('ok');
    });
    
    test('Special responses (withThrowActionResult)', async() => {
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            public withActionResult ()
            {
                throw new ActionResult('error', 401);
            }
            
        }
        
        const controller = new Controller();
        
        await (<any>router).handleRequest(
            controller,
            { requestMethod: 'GET', actionMethod: 'withActionResult' },
            {},
            response
        );
        
        expect(response.status)
            .toHaveBeenCalledTimes(1)
            .toHaveBeenLastCalledWith(401);
        
        expect(response.json)
            .toBeCalledTimes(1)
            .toHaveBeenLastCalledWith('error');
    });
    
    test('Special responses (withValidationException)', async() => {
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            public withActionResult ()
            {
                throw new ValidationException('error', 1640282204074);
            }
            
        }
        
        const controller = new Controller();
        
        await (<any>router).handleRequest(
            controller,
            { requestMethod: 'GET', actionMethod: 'withActionResult' },
            {},
            response
        );
        
        expect(response.status)
            .toHaveBeenCalledTimes(1)
            .toHaveBeenLastCalledWith(422);
        
        expect(response.json)
            .toBeCalledTimes(1)
            .toHaveBeenLastCalledWith({
                exception: ValidationException.name,
                code: 1640282204074,
            });
    });
    
    test('Special responses (genericException)', async() => {
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            public genericException ()
            {
                throw new Exception('error', 1640283642214);
            }
            
        }
        
        const controller = new Controller();
        
        await (<any>router).handleRequest(
            controller,
            { requestMethod: 'GET', actionMethod: 'genericException' },
            {},
            response
        );
        
        expect(response.status)
            .toHaveBeenCalledTimes(1)
            .toHaveBeenLastCalledWith(500);
        
        expect(response.json)
            .toBeCalledTimes(1)
            .toHaveBeenLastCalledWith({
                exception: Exception.name,
                code: 1640283642214,
                message: 'error [1640283642214]',
            });
    });
    
    test('Special responses (simpleException)', async() => {
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            public simpleException ()
            {
                throw 'unknown';
            }
            
        }
        
        const controller = new Controller();
        
        await (<any>router).handleRequest(
            controller,
            { requestMethod: 'GET', actionMethod: 'simpleException' },
            {},
            response
        );
        
        expect(response.status)
            .toHaveBeenCalledTimes(1)
            .toHaveBeenLastCalledWith(500);
    });
    
    
    test('With middleware', async() => {
        const spy = jest.fn();
        const middleware = (req, res, next) => {};
        
        @Route.JSON()
        class Controller
        {
            
            @Route.GET()
            @Middleware(middleware)
            public withMiddleware ()
            {
                return 'ok';
            }
            
            @Route.GET()
            @Middleware([ middleware ])
            public withMiddlewares ()
            {
                return 'ok';
            }
            
        }
        
        router.bindExpress(expressApp);
        
        expect(expressApp.get.mock.calls[0][0])
            .toBe('/withMiddleware');
        expect(expressApp.get.mock.calls[0][1])
            .toBe(middleware);
        
        expect(expressApp.get.mock.calls[1][0])
            .toBe('/withMiddlewares');
        expect(expressApp.get.mock.calls[1][1])
            .toBe(middleware);
    });
    
    
});
