import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import './styles/globals.css';
import {
  AppConfigProvider,
  useAppConfigContext,
} from './components/providers/ConfigProvider';
import { useEffect, useState } from 'react';
import logdna from '@logdna/browser';

import * as Posthog from './services/posthog';
import * as Sentry from './services/sentry';
import { AppProvider } from './components/providers/AppProvider';
import Main from './components/Main';
import { ErrorDialog } from './components/common';
import RageClickers from './components/RageClickers';
import Loader from './components/Loader/Loader';

function handleRageClicking(setIsRageClicking: (arg0: boolean) => void) {
  const now = Date.now();
  const lastClick = localStorage.getItem('lastClick') ?? '0';
  const secondLastClick = localStorage.getItem('secondLastClick') ?? '0';
  localStorage.setItem('lastClick', now.toString());
  localStorage.setItem('secondLastClick', lastClick);
  if (
    now - parseInt(lastClick) < 500 &&
    now - parseInt(secondLastClick) < 500
  ) {
    setIsRageClicking(true);
  }
}

function Home() {
  const { config, configError, telemetry, sqlpalEnv } = useAppConfigContext();
  const [isRageClicking, setIsRageClicking] = useState(false);

  useEffect(() => {
    if (telemetry !== undefined && telemetry === 'on') {
      // Sentry.init(config);
      Posthog.init(config);
      // if (config?.logdna?.key) {
      //   logdna.init(config.logdna.key, { app: 'dashboard' });
      //   logdna.addContext({
      //     env: sqlpalEnv,
      //   });
      // }
    }
  }, [telemetry, config]);

  const body = (
    <AppProvider>
      <Main />
    </AppProvider>
  );

  const app = (
    <div
      className="min-h-full dark:text-white"
      onClick={() => {
        handleRageClicking(setIsRageClicking);
      }}
    >
      {configError && <ErrorDialog />}
      {isRageClicking && <RageClickers show={setIsRageClicking} />}
      {!config?.server ? <Loader /> : <>{body}</>}
    </div>
  );
  return app;
}

export default function App() {
  return (
    <AppConfigProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </AppConfigProvider>
  );
}
