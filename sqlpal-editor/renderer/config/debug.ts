import { ConfigInterface } from './config';

const debug: ConfigInterface = {
  name: 'debug',
  engine: {
    pgHost: 'localhost',
    pgForceSsl: false,
    backendUrl: '/api/run',
    serverUrl: '/api/server',
  },
};

export default debug;
