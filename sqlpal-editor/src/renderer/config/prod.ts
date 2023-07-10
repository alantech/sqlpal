import { ConfigInterface } from './config';

const prod: ConfigInterface = !!global.window ? {
  name: 'prod',
  server: {
    url: 'http://localhost:8088',
  },
  } : ({} as ConfigInterface);

export default prod;
