export type ConfigEnvironments = 'local' | 'prod';

export interface ConfigInterface {
  name: string;
  // Configuration about which server to communicate with
  server: {
    url: string,
  },
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
}

export const throwError = (message: string): never => {
  throw new Error(message);
};
