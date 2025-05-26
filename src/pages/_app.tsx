import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { ToastProvider } from '@/lib/contexts/ToastContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ZOQ Agent | Autonomous Business Development</title>
        <meta name="description" content="An autonomous business development agent powered by Bright Data MCP" />
      </Head>
      <ErrorBoundary>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </ErrorBoundary>
    </>
  );
}
