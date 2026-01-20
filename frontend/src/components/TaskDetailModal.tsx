import { useState } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import api from '../lib/api';
import { X, MessageSquare, Send, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

import { ChecklistManager } from './ChecklistManager';
import { AttachmentManager } from './AttachmentManager';
import { ActivityList } from './ActivityList';
import { TagManager } from './TagManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

export const TaskDetailModal = ({ isOpen, onClose, task }: Props) => {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  // 1. QUERY INFINITA (Paginación)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['comments', task?.id],
      queryFn: async ({ pageParam = 1 }) => {
        // Blindaje: Si no hay ID, retornamos vacío para evitar llamadas 404/500
        if (!task?.id) return { data: [], meta: {} };

        const res = await api.get(
          `/tasks/${task.id}/comments?page=${pageParam}&limit=5`,
        );
        return res.data;
      },
      getNextPageParam: (lastPage) => {
        if (lastPage.meta?.page < lastPage.meta?.totalPages) {
          return lastPage.meta.page + 1;
        }
        return undefined;
      },
      enabled: !!task && isOpen && !!task.id,
      initialPageParam: 1,
    });

  const comments = data?.pages.flatMap((page) => page.data) || [];

  // 2. MUTATION: Enviar Comentario
  const postComment = useMutation({
    mutationFn: (content: string) =>
      api.post(`/tasks/${task.id}/comments`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', task.id] });
      setNewComment('');
    },
    onError: () => toast.error('No se pudo enviar el mensaje'),
  });

  const handleSubmitComment = (e: React.FormEvent) => {
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
        style={{
          width: '700px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* HEADER */}
        <div className='modal-header'>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {task.tags?.map((tag: any) => (
                <span
                  key={tag.id}
                  className='tag-pill'
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{task.content}</h2>
            <span style={{ fontSize: 12, color: '#999' }}>
              En lista: {task.column?.title || 'Tablero'}
            </span>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* BODY */}
        <div
          className='modal-body'
          style={{ flex: 1, overflowY: 'auto', padding: '20px' }}
        >
          {/* 🛡️ BLINDAJE: Solo mostramos TagManager si tenemos un ID válido */}
          {task && typeof task.id === 'number' ? (
            <TagManager
              taskId={task.id}
              activeTagIds={task.tags?.map((t: any) => t.id) || []}
            />
          ) : (
            <p style={{ fontSize: 12, color: '#ccc' }}>Cargando etiquetas...</p>
          )}

          <hr
            style={{
              margin: '20px 0',
              border: '0',
              borderTop: '1px solid var(--border-color)',
            }}
          />

          <ChecklistManager
            taskId={task.id}
            subtasks={task.subtasks || []}
          />
          <AttachmentManager
            taskId={task.id}
            attachments={task.attachments || []}
          />

          {/* COMENTARIOS PAGINADOS */}
          <div className='comments-section'>
            <h4>
              <MessageSquare size={14} /> Comentarios
            </h4>

            <div
              className='comment-list'
              style={{
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: 15,
              }}
            >
              {isLoading ? (
                <p style={{ fontSize: 12, color: '#999' }}>
                  Cargando charla...
                </p>
              ) : (
                <>
                  {comments.map((c: any) => (
                    <div
                      key={c.id}
                      className='comment-item'
                    >
                      <div className='comment-avatar'>
                        {c.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className='comment-bubble'>
                        <div className='comment-header'>
                          <strong>{c.user.name}</strong>
                          <span>{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p>{c.content}</p>
                      </div>
                    </div>
                  ))}

                  {hasNextPage && (
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      style={{
                        margin: '10px auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        background: 'transparent',
                        border: 'none',
                        color: '#4a90e2',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                      }}
                    >
                      {isFetchingNextPage ? (
                        'Cargando...'
                      ) : (
                        <>
                          <ChevronUp size={16} /> Cargar anteriores
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              {comments.length === 0 && !isLoading && (
                <p style={{ fontSize: 13, color: '#ccc', fontStyle: 'italic' }}>
                  Sé el primero en comentar.
                </p>
              )}
            </div>

            {/* INPUT COMENTARIO */}
            <form
              className='comment-form'
              onSubmit={handleSubmitComment}
            >
              <textarea
                placeholder='Escribe un comentario...'
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment(e);
                  }
                }}
              />
              <button
                type='submit'
                disabled={!newComment.trim() || postComment.isPending}
              >
                <Send size={16} />
              </button>
            </form>
          </div>

          <ActivityList taskId={task.id} />
        </div>
      </div>
    </div>
  );
};
