import { useEffect, useState } from 'react';

import { useAppConfigContext } from '../components/providers/ConfigProvider';
import { useAuth0 } from '@auth0/auth0-react';

import * as Posthog from '../services/posthog';
import * as Sentry from '../services/sentry';

export function useAuth() {
  const [token, setToken] = useState(null) as unknown as [string | null, (arg0: string) => void];
  const { getAccessTokenSilently, loginWithRedirect, isAuthenticated, isLoading, user } = useAuth0();
  const { config, uid } = useAppConfigContext();
  useEffect(() => {
    if (!config?.auth) {
      if (uid) {
        console.log('no auth, but uid so lets get the profile')
        window.electron.auth.getProfile().then((prof) => {
          console.log(prof)
        });
        // Sentry.identify(config, uid);
        Posthog.identify(config, uid);
      }
      return setToken('noauth');
    }
    // auth path
    const { audience, scope, redirect_uri: redirectUri, response_type: responseType } = config?.auth?.authorizationParams;
    if (!isAuthenticated && !isLoading) {
      return void loginWithRedirect({ redirectUri } as any);
    }
    if (isAuthenticated && !token) {
      getAccessTokenSilently({
        audience,
        scope,
        responseType,
      } as any).then((accessToken: any) => setToken(accessToken));
    }
    if (user && user.sub) {
      Sentry.identify(config, user.sub, user.email);
      Posthog.identify(config, user.sub);
    }
  }, [isAuthenticated, user, isLoading, getAccessTokenSilently, loginWithRedirect, token, setToken, config]);
  return {
    token,
    user,
  };
}
