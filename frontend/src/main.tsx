import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles.scss';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // <--- Importar aquí

// 1. Creamos el cliente AQUÍ, fuera de App
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 2. Envolvemos <App /> con el Provider AQUÍ */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
