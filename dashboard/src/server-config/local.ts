import { ConfigInterface } from './config';

const local: ConfigInterface = {
  db: {
    host: 'localhost',
    user: 'postgres',
    password: 'test',
    port: 5432,
    forceSSL: false,
  },
  server: {
    url: 'http://localhost:8088',
  },
};

export default local;
