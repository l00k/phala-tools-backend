import 'reflect-metadata';

export * from '@inti5/api';

export { Service } from './Service';

import './Serialization/ObjectLoaderByIdDeserializer';
import './Serialization/MikroORMSpecificSerializer';

import { Annotation as BaseAnnotation } from '@inti5/api'
import * as BackendAnnotation from './Annotation';
export const Annotation = Object.assign({}, BaseAnnotation, BackendAnnotation);

export * as Domain from './Domain';
