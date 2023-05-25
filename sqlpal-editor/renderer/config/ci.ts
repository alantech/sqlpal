import { ConfigInterface } from './config';

const ci: ConfigInterface = {
  name: 'ci',
  engine: {
    pgHost: 'localhost',
    pgForceSsl: false,
    backendUrl: '/api/run',
    serverUrl: '/api/server',
  },
};

export default ci;
