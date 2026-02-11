import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a2035',
            color: '#e0e0e0',
            border: '1px solid #1e2640',
            borderRadius: '8px',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#1a2035',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#1a2035',
            },
            duration: 5000,
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
