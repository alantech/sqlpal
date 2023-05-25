import { ConfigInterface } from './config';

const ci: ConfigInterface = {
  name: 'ci',
  engine: {
    pgHost: 'localhost',
    pgForceSsl: false,
    backendUrl: '/api/run',
    serverUrl: '/api/server',
  },
  auth: {
    domain: 'sqlpal.us.auth0.com',
    clientId: 'gFqVK6oPKmfGrir2j3YbLMHiROSgkSuV',
    authorizationParams: {
      redirect_uri: 'http://localhost/callback',
      scope: 'read:current_user',
      audience: 'https://api.sqlpal.ai',
    },
    useRefreshTokens: true,
  },
};

export default ci;
