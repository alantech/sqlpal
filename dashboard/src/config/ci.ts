import { ConfigInterface } from './config';

const ci: ConfigInterface = {
  name: 'ci',
  engine: {
    pgHost: 'localhost',
    pgForceSsl: false,
    backendUrl: '/api/run',
    palServerUrl: 'http://localhost:8080',
  },
};

export default ci;
