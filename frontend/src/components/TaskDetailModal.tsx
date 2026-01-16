import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ChecklistManager } from './ChecklistManager';
import { ActivityList } from './ActivityList';

interface Props {
  task: any;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal = ({ task, isOpen, onClose }: Props) => {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();
  const myName = localStorage.getItem('user_name'); // Para saber cuáles son míos visualmente

  // 1. Cargar comentarios
  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', task?.id],
    queryFn: async () =>
      (await axios.get(`http://localhost:3000/tasks/${task.id}/comments`)).data,
    enabled: !!task && isOpen, // Solo cargar si el modal está abierto
    refetchInterval: 5000, // Refrescar cada 5 seg para ver chat en vivo
  });

  // 2. Enviar comentario
  const postComment = useMutation({
    mutationFn: (content: string) =>
      axios.post(`http://localhost:3000/tasks/${task.id}/comments`, {
        content,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] });
      setNewComment('');
    },
    onError: () => toast.error('Error al enviar mensaje'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    postComment.mutate(newComment);
  };

  if (!isOpen || !task) return null;

  return (
    <div
      className='modal-overlay'
      onClick={onClose}
    >
      <div
        className='modal-content'
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABECERA */}
        <div className='modal-header'>
          <h2>📝 Detalles de la Tarea</h2>
          <button onClick={onClose}>&times;</button>
        </div>

        {/* CUERPO */}
        <div className='modal-body'>
          {/* Detalles estáticos */}
          <div className='task-details-section'>
            <h3 style={{ marginTop: 0 }}>{task.content}</h3>
            <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
              <span
                style={{
                  background: '#eee',
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
              >
                Prioridad: <strong>{task.priority}</strong>
              </span>
              {task.dueDate && (
                <span
                  style={{
                    background: '#eee',
                    padding: '4px 8px',
                    borderRadius: 4,
                  }}
                >
                  Vence: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <ChecklistManager
            taskId={task.id}
            subtasks={task.subtasks || []}
          />

          {/* Chat de Comentarios */}
          <div className='comments-section'>
            <h4>
              <MessageSquare
                size={12}
                style={{ marginRight: 5 }}
              />{' '}
              Comentarios
            </h4>

            {isLoading ? (
              <p style={{ textAlign: 'center', color: '#999' }}>
                Cargando chat...
              </p>
            ) : comments?.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#ccc',
                  fontStyle: 'italic',
                }}
              >
                Sé el primero en comentar...
              </p>
            ) : (
              comments?.map((c: any) => {
                const isMine = c.user.name === myName;
                return (
                  <div
                    key={c.id}
                    className={`comment-bubble ${isMine ? 'mine' : ''}`}
                  >
                    <div className='avatar-circle'>
                      {c.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className='bubble-content'>
                      <span className='author-name'>
                        {c.user.name}{' '}
                        <span style={{ fontWeight: 'normal', opacity: 0.6 }}>
                          ({c.user.role})
                        </span>
                      </span>
                      {c.content}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <ActivityList taskId={task.id} />
        </div>

        {/* PIE (Input) */}
        <form
          className='modal-footer'
          onSubmit={handleSubmit}
        >
          <input
            placeholder='Escribe un comentario...'
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            autoFocus
          />
          <button
            type='submit'
            disabled={postComment.isPending}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
