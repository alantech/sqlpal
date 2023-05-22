import type { AppProps } from 'next/app';
import Head from 'next/head';

import { AppConfigProvider } from '../components/providers/ConfigProvider';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const app = (
    <>
      <Head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='theme-color' content='#000000' />
        <meta name='description' content='SQL editor with AI suggestions based on your database schema' />
        <title>SQLPal</title>
      </Head>
      <AppConfigProvider>
        <Component {...pageProps} />
      </AppConfigProvider>
    </>
  );
  return app;
}
