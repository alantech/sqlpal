import { createContext, useContext, useEffect, useState } from 'react';

import config from '../../config';
import {
  ConfigEnvironments,
  ConfigInterface,
  throwError,
} from '../../config/config';

interface AppConfig {
  telemetry?: 'on' | 'off';
  sqlpalEnv: ConfigEnvironments;
  config: ConfigInterface;
  configError?: string | null;
}

const AppConfigContext = createContext<AppConfig>({} as AppConfig);

const useAppConfigContext = () => {
  return useContext(AppConfigContext);
};

const AppConfigProvider = ({ children }: { children: any }) => {
  const [appConfig, setAppConfig] = useState({} as AppConfig);
  useEffect(() => {
    const getConfig = async () => {
      const configJson = window?.electron?.config?.get();
      if (!Object.keys(appConfig).length && Object.keys(configJson ?? {}).length) {
        const initialAppConfig: AppConfig = {} as AppConfig;
        if (!configJson.sqlpalEnv) throwError('No SQLPal ENV provided');
        initialAppConfig.sqlpalEnv = configJson.sqlpalEnv as ConfigEnvironments;
        const envConfig = config[configJson?.sqlpalEnv as ConfigEnvironments];
        if (!envConfig) throwError('Invalid SQLPal ENV provided');
        initialAppConfig.config = envConfig;
        initialAppConfig.telemetry = configJson.telemetry as 'on' | 'off';
        setAppConfig(initialAppConfig);
      }
      // }
    };
    getConfig().catch((e: any) => {
      setAppConfig({
        configError:
          e.message ?? 'An error occurred getting initialization values.',
      } as AppConfig);
    });
  }, [appConfig]);
  return (
    <AppConfigContext.Provider value={appConfig}>
      {children}
    </AppConfigContext.Provider>
  );
};

export { AppConfigProvider, useAppConfigContext };
