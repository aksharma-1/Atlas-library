import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';
import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on 401 — the user simply isn't logged in
      retry: (failureCount, error: unknown) => {
        if (
          error instanceof Error &&
          'status' in error &&
          (error as { status: number }).status === 401
        ) {
          return false;
        }
        return failureCount < 2;
      },
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
          toastOptions={{
            duration: 3500,
            className: '!rounded-xl !border !shadow-lg !text-xs !font-medium',
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
