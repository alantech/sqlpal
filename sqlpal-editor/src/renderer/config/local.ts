import { ConfigInterface } from './config';

const local: ConfigInterface = !!global.window
  ? {
      name: 'local',
      server: {
        url: 'http://localhost:8088',
      },
      // auth: {
      //   domain: 'sqlpal.us.auth0.com',
      //   clientId: 'gFqVK6oPKmfGrir2j3YbLMHiROSgkSuV',
      //   authorizationParams: {
      //     redirect_uri: 'http://localhost/callback',
      //     scope: 'read:current_user',
      //     audience: 'https://api.sqlpal.ai',
      //   },
      //   useRefreshTokens: false,
      // },
    }
  : ({} as ConfigInterface);

export default local;
