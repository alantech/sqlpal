// import posthog from 'posthog-js';

import { ConfigInterface } from './config';

const prod: ConfigInterface = !!global.window ? {
  name: 'prod',
  server: {
    // url: 'https://api.sqlpal.ai',
    url: 'http://localhost:8088',
  },
  posthog: {
    key: 'phc_8AIyTQ8yfM5hEeUEv4gMmIqIHq0KJ3q6nszlZKTmnDw',
  },
  // sentry: {
  //   dsn: 'https://8ba9a3820f7f4179b5dc12754da9c943@o1090662.ingest.sentry.io/6544238',
  //   integrations: [new posthog.SentryIntegration(posthog, 'iasql', 6544238)],
  //   environment: 'local',
  // },
  // logdna: {
  //   key: 'b98181227b606d8ee6c5674b5bb948e7',
  // },
  // auth: {
  //   domain: 'sqlpal.us.auth0.com',
  //   clientId: 'gFqVK6oPKmfGrir2j3YbLMHiROSgkSuV',
  //   authorizationParams: {
  //     redirect_uri: 'http://localhost/callback',
  //     scope: 'read:current_user',
  //     audience: 'https://api.sqlpal.ai',
  //   },
  //   useRefreshTokens: true,
  // },
  } : ({} as ConfigInterface);

export default prod;
