import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag as TagIcon, Check } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Props {
  taskId: number;
  activeTagIds: number[];
}

export const TagManager = ({ taskId, activeTagIds = [] }: Props) => {
  const queryClient = useQueryClient();

  // Estado local para Optimistic UI
  const [localSelectedIds, setLocalSelectedIds] =
    useState<number[]>(activeTagIds);
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3498db');

  // Sincronización
  useEffect(() => {
    setLocalSelectedIds(activeTagIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(activeTagIds)]);

  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await api.get('/tags')).data,
  });

  const createTag = useMutation({
    mutationFn: (data: any) => api.post('/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsCreating(false);
      setNewTagName('');
      toast.success('Etiqueta creada');
    },
  });

  const updateTaskTags = useMutation({
    mutationFn: (newTagIds: number[]) => {
      if (!taskId) return Promise.reject('Task ID faltante');
      return api.patch(`/tasks/${taskId}`, { tagIds: newTagIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
    onError: (err) => {
      setLocalSelectedIds(activeTagIds);
      toast.error('Error al guardar etiquetas');
    },
  });

  const handleToggleTag = (tagId: number) => {
    if (!taskId) return;

    const newTags = localSelectedIds.includes(tagId)
      ? localSelectedIds.filter((id) => id !== tagId) // Desmarcar
      : [...localSelectedIds, tagId]; // Marcar

    // 1. Actualización visual instantánea
    setLocalSelectedIds(newTags);

    // 2. Enviar al servidor
    updateTaskTags.mutate(newTags);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    createTag.mutate({ name: newTagName, color: newTagColor });
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <h4
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.9rem',
          marginBottom: 10,
        }}
      >
        <TagIcon size={14} /> Etiquetas
      </h4>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allTags?.map((tag: any) => {
          const isActive = localSelectedIds.includes(tag.id);
          return (
            <div
              key={tag.id}
              onClick={() => handleToggleTag(tag.id)}
              style={{
                backgroundColor: tag.color,
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: isActive ? '2px solid #000' : '2px solid transparent',
                opacity: isActive ? 1 : 0.6,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.1s',
                userSelect: 'none',
              }}
            >
              {tag.name}
              {isActive && (
                <Check
                  size={12}
                  strokeWidth={3}
                />
              )}
            </div>
          );
        })}

        <button
          onClick={() => setIsCreating(!isCreating)}
          style={{
            background: 'transparent',
            border: '1px dashed var(--text-secondary)',
            color: 'var(--text-secondary)',
            borderRadius: 12,
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Plus size={14} /> Nueva
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          // 🎨 CSS UPDATE: Usamos 'column' para apilar los elementos
          style={{
            marginTop: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {/* FILA 1: Input y Color */}
          <div style={{ display: 'flex', gap: 5, width: '100%' }}>
            <input
              autoFocus
              type='text'
              placeholder='Nombre de etiqueta...'
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              style={{
                flex: 1, // Ocupa todo el espacio disponible
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
              }}
            />
            <input
              type='color'
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              title='Color de etiqueta'
              style={{
                width: 35,
                height: 30, // Un poco más alto para ser más clickeable
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderRadius: 4,
              }}
            />
          </div>

          {/* FILA 2: Botón Guardar (Ancho completo) */}
          <button
            type='submit'
            disabled={!newTagName}
            style={{
              width: '100%',
              background: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              opacity: !newTagName ? 0.7 : 1,
            }}
          >
            Guardar Etiqueta
          </button>
        </form>
      )}
    </div>
  );
};
