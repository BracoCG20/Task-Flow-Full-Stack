import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { User, Lock, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { name: string; email: string } | null;
  onUpdateSuccess: (newName: string) => void;
}

export const ProfileModal = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateSuccess,
}: Props) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // Cargar nombre actual cuando se abre el modal
  useEffect(() => {
    if (currentUser) setName(currentUser.name);
  }, [currentUser, isOpen]);

  const updateProfile = useMutation({
    mutationFn: (data: any) => axios.put('http://localhost:3000/profile', data),
    onSuccess: (res) => {
      toast.success('Perfil actualizado ✅');
      onUpdateSuccess(res.data.name);
      setPassword(''); // Limpiar password por seguridad
      onClose();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({ name, password });
  };

  if (!isOpen) return null;

  return (
    <div
      className='modal-overlay'
      onClick={onClose}
    >
      <div
        className='modal-content'
        onClick={(e) => e.stopPropagation()}
        style={{ width: 400, height: 'auto' }}
      >
        <div className='modal-header'>
          <h2>👤 Mi Perfil</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form
          className='modal-body'
          onSubmit={handleSubmit}
          style={{ gap: 20, display: 'flex', flexDirection: 'column' }}
        >
          {/* Avatar Visual (Generado con iniciales) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#4a90e2',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 30,
                fontWeight: 'bold',
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: '#666' }}>
              Nombre
            </label>
            <div style={inputGroupStyle}>
              <User
                size={18}
                color='#999'
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: '#666' }}>
              Nueva Contraseña (Opcional)
            </label>
            <div style={inputGroupStyle}>
              <Lock
                size={18}
                color='#999'
              />
              <input
                type='password'
                placeholder='Dejar vacío para no cambiar'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 'bold', color: '#666' }}>
              Email (No editable)
            </label>
            <div style={{ ...inputGroupStyle, background: '#eee' }}>
              <span style={{ fontSize: 14, color: '#666', padding: '5px 0' }}>
                {currentUser?.email}
              </span>
            </div>
          </div>
        </form>

        <div className='modal-footer'>
          <button
            onClick={handleSubmit}
            disabled={updateProfile.isPending}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              padding: '10px 0',
            }}
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

// Estilos rápidos
const inputGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #ddd',
  padding: '10px',
  borderRadius: 8,
};
const inputStyle: React.CSSProperties = {
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: 14,
};
