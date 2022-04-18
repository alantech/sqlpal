import { ConfigInterface, } from './config';

const config: ConfigInterface = {
  http: {
    port: 8088,
  },
  db: {
    host: 'localhost',
    user: 'postgres',
    password: 'test',
    port: 5432,
    forceSSL: false,
  },
  logger: {
    debug: false,
    test: true,
  },
};

export default config;