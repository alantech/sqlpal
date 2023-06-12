import { ConfigInterface } from './config';

const prod: ConfigInterface = {
  name: 'prod',
  auth: {
    domain: 'sqlpal.us.auth0.com',
    clientId: 'gFqVK6oPKmfGrir2j3YbLMHiROSgkSuV',
    authorizationParams: {
      redirect_uri: 'http://localhost/callback',
      scope: 'openid profile offline_access',
      audience: 'https://api.sqlpal.ai',
      response_type: 'code',
    },
  },
};

export default prod;
