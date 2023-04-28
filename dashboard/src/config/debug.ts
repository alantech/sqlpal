import { ConfigInterface } from './config';

const debug: ConfigInterface = {
  name: 'debug',
  engine: {
    pgHost: 'localhost',
    pgForceSsl: false,
    backendUrl: '/api/run',
    palServerUrl: 'http://localhost:8080',
  },
};

export default debug;
