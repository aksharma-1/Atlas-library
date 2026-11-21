import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import App from './App.tsx';

// Auto-register PWA service worker with reload prompt / auto-update
registerSW({ immediate: true });

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 401 / 403 or Axios errors with status 401/403 — the user simply isn't logged in
      retry: (failureCount, error: any) => {
        const status = error?.response?.status ?? error?.status;
        if (status === 401 || status === 403) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false, // Don't refetch on tab focus to avoid spamming /me
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <App />
        <Toaster
          position="top-right"
          gutter={8}
          containerStyle={{
            zIndex: 99999,
          }}
          toastOptions={{
            duration: 4000,
            className: '!rounded-xl !border !shadow-2xl !text-xs !font-medium',
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              borderColor: '#1e293b',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                borderColor: 'rgba(16, 185, 129, 0.3)',
              },
            },
            error: {
              duration: 4500,
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
              style: {
                borderColor: 'rgba(244, 63, 94, 0.3)',
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
