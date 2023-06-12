import { useEffect, useState } from 'react';

import { useAppConfigContext } from '../components/providers/ConfigProvider';
import * as Posthog from '../services/posthog';

export function useAuth() {
  const [token, setToken] = useState(null) as unknown as [
    string | null,
    (arg0: string) => void
  ];
  const [user, setUser] = useState(null) as unknown as [
    any | null,
    (arg0: any) => void
  ];
  const { config, sqlpalEnv } = useAppConfigContext();
  const isLocal = sqlpalEnv === 'local';
  useEffect(() => {
    const getAuthInfo = async () => {
      if (isLocal) {
        setToken('noauth');
        Posthog.identify(config, sqlpalEnv);
        return;
      }
      const profile = await window.electron.auth.getProfile();
      if (profile.email && profile.sub) {
        setUser(profile);
        Posthog.identify(config, profile.sub);
      }
      const accessToken = await window.electron.auth.getAccessToken();
      if (accessToken) {
        setToken(accessToken);
      }
    };
    getAuthInfo().catch((err) => {
      console.log(err);
    });
  }, [token, setToken, config]);
  return {
    token,
    user,
  };
}
