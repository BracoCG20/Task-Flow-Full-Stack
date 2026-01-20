import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles.scss';

// 1. Imports necesarios
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ErrorBoundary } from 'react-error-boundary'; // <--- Importar
import { ErrorFallback } from './components/ErrorFallback.tsx'; // <--- Importar

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()} // Al dar click en "Intentar", recarga la página
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
