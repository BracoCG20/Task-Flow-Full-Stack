import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Tag {
  id: number;
  name: string;
  color: string;
}

interface Props {
  selectedTagIds: number[];
  onChange: (ids: number[]) => void;
}

export const TagManager = ({ selectedTagIds, onChange }: Props) => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3498db');

  // 1. Obtener etiquetas disponibles
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await axios.get('http://localhost:3000/tags')).data,
  });

  // 2. Crear nueva etiqueta
  const createTag = useMutation({
    mutationFn: (data: any) => axios.post('http://localhost:3000/tags', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsCreating(false);
      setNewTagName('');
      toast.success('Etiqueta creada');
    },
  });

  const toggleTag = (id: number) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((tid) => tid !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  const handleCreate = () => {
    if (!newTagName) return;
    createTag.mutate({ name: newTagName, color: newTagColor });
  };

  return (
    <div>
      <label style={{ fontSize: 12, color: '#666', fontWeight: 'bold' }}>
        Etiquetas:
      </label>

      {/* Lista de Selección */}
      <div className='tag-selector'>
        {tags?.map((tag: Tag) => (
          <div
            key={tag.id}
            className={`tag-option ${
              selectedTagIds.includes(tag.id) ? 'selected' : ''
            }`}
            style={{ backgroundColor: tag.color, color: 'white' }}
            onClick={() => toggleTag(tag.id)}
          >
            {tag.name} {selectedTagIds.includes(tag.id) && '✓'}
          </div>
        ))}

        {/* Botón para crear nueva */}
        <div
          className='tag-option'
          style={{
            background: '#eee',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
          }}
          onClick={() => setIsCreating(!isCreating)}
        >
          <Plus size={10} /> Nueva
        </div>
      </div>

      {/* Formulario pequeño para crear etiqueta */}
      {isCreating && (
        <div
          style={{
            display: 'flex',
            gap: 5,
            marginBottom: 10,
            alignItems: 'center',
          }}
        >
          <input
            placeholder='Nombre etiqueta'
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            style={{
              padding: 4,
              fontSize: 12,
              border: '1px solid #ddd',
              borderRadius: 4,
              width: 100,
            }}
          />
          <input
            type='color'
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            style={{ width: 30, height: 25, border: 'none', cursor: 'pointer' }}
          />
          <button
            onClick={handleCreate}
            style={{
              background: '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 10,
              padding: '4px 8px',
            }}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
};
