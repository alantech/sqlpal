import { ConfigInterface } from './config';

const local: ConfigInterface = !!global.window ? {
  name: 'local',
  server: {
    url: 'http://localhost:8088',
  },
  } : ({} as ConfigInterface);

export default local;
