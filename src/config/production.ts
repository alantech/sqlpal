import { ConfigInterface, throwError, } from './config';

const config: ConfigInterface = {
  http: {
    port: 8088,
  },
  db: {
    host: 'db.iasql.com',
    // TODO: Move away from env var to secrets
    user: process.env.DB_USER ?? throwError('No DB User defined'),
    password: process.env.DB_PASSWORD ?? throwError('No DB Password defined'),
    port: 5432,
    forceSSL: true,
  },
  logger: {
    debug: true,
    test: false,
  },
  auth: {
    domain: 'https://auth.iasql.com/',
    audience: 'https://api.iasql.com', // id of this api in auth0
  },
  sentry: {
    dsn: 'https://e257e8d6646e4657b4f556efc1de31e8@o1090662.ingest.sentry.io/6106929',
  },
  telemetry: {
    amplitudeKey: '968524573d0f8bd2e84460099bca9353'
  }
};

export default config;