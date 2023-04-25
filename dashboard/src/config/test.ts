import { ConfigInterface } from './config';

const test: ConfigInterface = {
  name: 'test',
  engine: {
    pgHost: 'localhost',
    pgForceSsl: false,
    backendUrl: '/api/run',
    palServerUrl: 'http://localhost:5000',
  },
};

export default test;
