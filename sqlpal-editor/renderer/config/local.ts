import { ConfigInterface } from './config';

const local: ConfigInterface = !!global.window ? {
  name: 'local',
  engine: {
    pgHost: 'localhost',
    pgForceSsl: false,
    backendUrl: '/api/run',
    serverUrl: 'api/server',
  },
  } : ({} as ConfigInterface);

export default local;
