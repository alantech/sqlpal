import { ConfigInterface } from './config';

// tslint:disable-next-line:no-var-requires
const config: ConfigInterface = require(`./${process.env.NODE_ENV === 'production' ? 'prod' : 'local'}`).default;

export default config;
