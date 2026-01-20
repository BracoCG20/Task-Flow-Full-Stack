import { useState, useRef, useEffect } from 'react';
import { MessageSquare, CheckSquare } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import { TagManager } from './TagManager';
import toast from 'react-hot-toast';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Subtask {
  id: number;
  isCompleted: boolean;
}

interface Task {
  id: number;
  content: string;
  priority: string;
  dueDate?: string;
  tags?: Tag[];
  subtasks?: Subtask[];
}

interface Props {
  task: Task;
  index: number;
  onDelete: (id: number) => void;
  onUpdate: (
    id: number,
    data: {
      content?: string;
      priority?: string;
      dueDate?: string;
      // tagIds eliminado de aquí porque TagManager lo maneja independientemente
    },
  ) => void;
  onOpenChat: (task: any) => void;
}

const priorityColors: Record<string, string> = {
  low: '#10ac84',
  medium: '#ff9f43',
  high: '#ee5253',
};

const MAX_WORDS = 500;

export const TaskCard = ({
  task,
  index,
  onDelete,
  onUpdate,
  onOpenChat,
}: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDate, setEditDate] = useState(
    task.dueDate ? task.dueDate.split('T')[0] : '',
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const completedSubtasks =
    task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  const countWords = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const wordCount = countWords(editContent);
  const isOverLimit = wordCount > MAX_WORDS;

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    if (isEditing) {
      adjustTextareaHeight();
    }
  }, [isEditing, editContent]);

  const handleSave = () => {
    if (!editContent.trim()) {
      toast.error('La tarea no puede estar vacía');
      return;
    }
    if (isOverLimit) {
      toast.error(`El texto excede el límite de ${MAX_WORDS} palabras.`);
      return;
    }
    onUpdate(task.id, {
      content: editContent,
      priority: editPriority,
      dueDate: editDate || undefined,
      // No enviamos tags aquí, TagManager ya los guardó
    });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditContent(task.content);
      setEditPriority(task.priority);
      setEditDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setIsEditing(false);
    }
  };

  return (
    <Draggable
      draggableId={String(task.id)}
      index={index}
    >
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className='task-card'
          style={{
            ...provided.draggableProps.style,
            borderLeftColor: priorityColors[task.priority] || '#ccc',
          }}
        >
          {isEditing ? (
            // --- MODO EDICIÓN ---
            <div className='edit-mode-container'>
              <textarea
                ref={textareaRef}
                autoFocus
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className='edit-textarea'
                placeholder='Escribe los detalles de la tarea...'
                rows={1}
              />
              <div
                className={`word-counter ${
                  isOverLimit ? 'limit-exceeded' : ''
                }`}
              >
                {wordCount} / {MAX_WORDS} palabras
              </div>

              {/* TagManager Inteligente: Guarda cambios automáticamente */}
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <TagManager
                  taskId={task.id}
                  activeTagIds={task.tags?.map((t) => t.id) || []}
                />
              </div>

              <div className='edit-controls-row'>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className='edit-select'
                >
                  <option value='low'>Baja 🟢</option>
                  <option value='medium'>Media 🟠</option>
                  <option value='high'>Alta 🔴</option>
                </select>
                <input
                  type='date'
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className='edit-date'
                />
              </div>
              <button
                onClick={handleSave}
                className='save-btn'
                disabled={isOverLimit || !editContent.trim()}
              >
                {isOverLimit ? 'Límite excedido' : 'Guardar Cambios'}
              </button>
              <span className='span-card'>
                (Ctrl + Enter para guardar, Esc para cancelar)
              </span>
            </div>
          ) : (
            // --- MODO VISUALIZACIÓN ---
            <>
              {/* ETIQUETAS */}
              <div
                style={{ display: 'flex', flexWrap: 'wrap', marginBottom: 5 }}
              >
                {task.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className='tag-pill'
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              {/* CONTENIDO */}
              <div
                className='task-content-view'
                onDoubleClick={() => setIsEditing(true)}
                title='Doble clic para editar'
              >
                {task.content}
              </div>

              {/* FOOTER */}
              <div className='task-footer'>
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  {task.dueDate && (
                    <span className='task-date'>
                      📅 {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}

                  {totalSubtasks > 0 && (
                    <span
                      className='subtasks-indicator'
                      title={`${completedSubtasks}/${totalSubtasks} completadas`}
                      style={{
                        fontSize: 11,
                        color: '#666',
                        background: '#f0f2f5',
                        padding: '2px 6px',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckSquare size={12} /> {completedSubtasks}/
                      {totalSubtasks}
                    </span>
                  )}

                  <span
                    className='task-date'
                    style={{
                      cursor: 'pointer',
                      background: '#e1f5fe',
                      color: '#0288d1',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenChat(task);
                    }}
                    title='Ver comentarios y checklist'
                  >
                    <MessageSquare size={14} />
                  </span>
                </div>

                <span
                  className='delete-btn'
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                >
                  🗑️
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
};
