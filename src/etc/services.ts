import { OrmFactory } from '@inti5/app-backend/ORM/Factory';
import { ObjectManager } from '@inti5/object-manager';


const objectManager = ObjectManager.getSingleton();

export default {
    'orm': () => objectManager.getInstance(OrmFactory).create(),
};
