export type ConfigEnvironments = 'local' | 'prod';

export interface ConfigInterface {
  name: string;
  // Configuration for the auth0 access control
  auth?: {
    domain: string;
    clientId: string;
    authorizationParams: {
      audience: string;
      redirect_uri: string;
      scope: string;
    };
    useRefreshTokens: boolean;
  };
  posthog?: {
    key: string;
  };
  // Configuration for Sentry
  sentry?: {
    // Not including this sub-object implies it is not enabled
    dsn: string;
    environment: string;
    // TODO better type is not allowed, but eventually?
    integrations: [any];
  };
  logdna?: {
    // Not including this sub-object implies it is not enabled
    key: string;
  };
  // Configuration about which server to communicate with
  server: {
    url: string,
  },
}

export const throwError = (message: string): never => {
  throw new Error(message);
};
