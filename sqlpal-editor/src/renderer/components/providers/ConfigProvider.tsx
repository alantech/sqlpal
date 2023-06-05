import { createContext, useContext, useEffect, useState } from 'react';

import config from '../../config';
import { ConfigEnvironments, ConfigInterface, throwError } from '../../config/config';

interface AppConfig {
  uid?: string;
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
      console.log(`am i running?`)
      // const response = await fetch(`/api/config`);
      // if (response.status === 200) {
        // const configJson = await response.json();
        const configJson = {sqlpalEnv: 'local' as ConfigEnvironments, uid: 'test', telemetry: 'off' as 'on' | 'off'};
        if (!Object.keys(appConfig).length) {
          const initialAppConfig: AppConfig = {} as AppConfig;
          if (!configJson.sqlpalEnv) throwError('No SQLPAL ENV provided');
          initialAppConfig.sqlpalEnv = configJson.sqlpalEnv;
          const envConfig = config[configJson?.sqlpalEnv as ConfigEnvironments];
          console.log(configJson?.sqlpalEnv)
          console.log(envConfig)
          if (!envConfig) throwError('Invalid SQLPAL ENV provided');
          initialAppConfig.config = envConfig;
          if (!initialAppConfig.config?.auth && !configJson.uid) throwError('No UID provided');
          initialAppConfig.uid = configJson.uid;
          initialAppConfig.telemetry = configJson.telemetry;
          setAppConfig(initialAppConfig);
        }
      // }
    };
    getConfig().catch((e: any) => {
      setAppConfig({
        configError: e.message ?? 'An error occurred getting initialization values.',
      } as AppConfig);
    });
  }, [appConfig]);
  return <AppConfigContext.Provider value={appConfig}>{children}</AppConfigContext.Provider>;
};

export { AppConfigProvider, useAppConfigContext };
