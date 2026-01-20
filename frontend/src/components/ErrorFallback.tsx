import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  error: any;
  resetErrorBoundary: () => void;
}

export const ErrorFallback = ({ error, resetErrorBoundary }: Props) => {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)', // Usa tus variables de tema
        color: 'var(--text-color)',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <div style={{ marginBottom: 20, color: '#e74c3c' }}>
        <AlertTriangle size={64} />
      </div>
      <h2 style={{ marginBottom: 10 }}>¡Oops! Algo salió mal</h2>
      <p
        style={{
          maxWidth: '500px',
          marginBottom: 20,
          color: 'var(--text-secondary)',
        }}
      >
        La aplicación ha encontrado un error inesperado. No te preocupes, esto
        suele arreglarse recargando.
      </p>

      {/* Mostramos el error técnico solo si estamos en desarrollo (opcional) */}
      <div
        style={{
          background: 'rgba(255,0,0,0.1)',
          padding: 15,
          borderRadius: 8,
          marginBottom: 25,
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          color: '#e74c3c',
          maxWidth: '100%',
          overflow: 'auto',
        }}
      >
        {error.message}
      </div>

      <button
        onClick={resetErrorBoundary}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          background: '#4a90e2',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: '1rem',
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        <RefreshCw size={18} />
        Intentar de nuevo
      </button>
    </div>
  );
};
