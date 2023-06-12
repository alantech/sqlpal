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
      response_type?: string;
    };
    useRefreshTokens?: boolean;
  };
}

export const throwError = (message: string): never => {
  throw new Error(message);
};
