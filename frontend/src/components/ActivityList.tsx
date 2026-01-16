import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { History, Clock } from 'lucide-react';

interface Props {
  taskId: number;
}

export const ActivityList = ({ taskId }: Props) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity', taskId],
    queryFn: async () =>
      (await axios.get(`http://localhost:3000/tasks/${taskId}/activity`)).data,
    refetchInterval: 5000, // Refrescar auto para ver movimientos de otros
  });

  if (isLoading)
    return (
      <div style={{ fontSize: 12, color: '#999' }}>Cargando historial...</div>
    );

  return (
    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee' }}>
      <h4
        style={{
          margin: '0 0 15px 0',
          color: '#888',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <History size={14} /> Actividad
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {logs?.map((log: any) => (
          <div
            key={log.id}
            style={{ display: 'flex', gap: 10, fontSize: 13 }}
          >
            <div style={{ minWidth: 20, paddingTop: 2 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#ccc',
                }}
              ></div>
            </div>
            <div>
              <div>
                <span style={{ fontWeight: 'bold', color: '#333' }}>
                  {log.user.name}
                </span>{' '}
                <span style={{ color: '#555' }}>{log.action}</span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#999',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  marginTop: 2,
                }}
              >
                <Clock size={10} /> {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
        {logs?.length === 0 && (
          <p style={{ color: '#ccc', fontStyle: 'italic' }}>
            Sin actividad reciente
          </p>
        )}
      </div>
    </div>
  );
};
