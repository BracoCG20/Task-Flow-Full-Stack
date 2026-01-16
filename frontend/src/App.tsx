import { useState, useEffect } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import toast, { Toaster } from 'react-hot-toast';
import { GripHorizontal } from 'lucide-react';

import { TaskCard } from './components/TaskCard';
import { BoardSkeleton } from './components/BoardSkeleton';
import { AdminSidebar } from './components/AdminSidebar';
import { TaskDetailModal } from './components/TaskDetailModal';
import { AnalyticsModal } from './components/AnalyticsModal';
import { ProfileModal } from './components/ProfileModal';

// --- CONFIGURACIÓN DE AXIOS ---
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- COMPONENTE 1: LOGIN ---
const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const loadingToast = toast.loading('Autenticando...');
    try {
      const res = await axios.post('http://localhost:3000/login', {
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user_name', res.data.name);
      localStorage.setItem('user_role', res.data.role);
      localStorage.setItem('user_id', String(res.data.userId));

      toast.success(`Bienvenido ${res.data.name}`, { id: loadingToast });
      onLogin();
    } catch (error) {
      toast.error('Credenciales inválidas', { id: loadingToast });
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-box'>
        <h2>Iniciar Sesión</h2>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 20 }}>
          Acceso restringido a empleados
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type='password'
            placeholder='Contraseña'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type='submit'>Entrar</button>
        </form>
      </div>
    </div>
  );
};

// --- COMPONENTE 2: TASKFLOW ---
interface TaskFlowProps {
  onLogout: () => void;
  targetUserId: number | null;
}

const TaskFlow = ({ onLogout, targetUserId }: TaskFlowProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Estado local para "recordar" qué tarea abrimos (Snapshot inicial)
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const [showProfile, setShowProfile] = useState(false);

  const [myName, setMyName] = useState(localStorage.getItem('user_name') || '');
  const myRole = localStorage.getItem('user_role');

  const handleProfileUpdate = (name: string) => {
    localStorage.setItem('user_name', name);
    setMyName(name);
  };

  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards', targetUserId],
    queryFn: async () => {
      const url = targetUserId
        ? `http://localhost:3000/boards?userId=${targetUserId}`
        : 'http://localhost:3000/boards';
      return (await axios.get(url)).data;
    },
    refetchOnWindowFocus: false,
  });

  // --- SOLUCIÓN DE DATOS EN VIVO ---
  // Calculamos la versión más reciente de la tarea seleccionada basándonos en 'boards'
  // Esto permite que el modal se actualice automáticamente cuando cambia algo (ej: checklist)
  const activeTask =
    selectedTask && boards
      ? boards[0]?.columns
          .flatMap((col: any) => col.tasks)
          .find((t: any) => t.id === selectedTask.id)
      : null;

  const createBoardMutation = useMutation({
    mutationFn: async () =>
      axios.post('http://localhost:3000/boards', { title: 'Nuevo Tablero' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('¡Tablero creado!');
    },
  });

  const addTask = useMutation({
    mutationFn: (data: any) => axios.post('http://localhost:3000/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Tarea agregada');
    },
  });

  const moveTask = useMutation({
    mutationFn: (data: any) =>
      axios.patch(`http://localhost:3000/tasks/${data.id}`, {
        columnId: data.columnId,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const reorderColumns = useMutation({
    mutationFn: (columnIds: number[]) =>
      axios.put('http://localhost:3000/columns/reorder', { columnIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`http://localhost:3000/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast('Tarea eliminada', { icon: '🗑️' });
    },
  });

  const updateTask = useMutation({
    mutationFn: (data: { id: number; updates: any }) =>
      axios.patch(`http://localhost:3000/tasks/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Guardado');
    },
  });

  const handleNewTask = (columnId: number) => {
    toast(
      (t) => (
        <div className='flex items-center gap-2'>
          <span>Nueva tarea:</span>
          <input
            autoFocus
            className='border p-1 rounded text-sm'
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value;
                if (val) addTask.mutate({ content: val, columnId });
                toast.dismiss(t.id);
              }
            }}
          />
          <button
            onClick={() => toast.dismiss(t.id)}
            className='text-red-500 font-bold'
          >
            ✕
          </button>
        </div>
      ),
      { duration: 5000, position: 'top-center' }
    );
  };

  if (isLoading)
    return (
      <div
        className='app-container'
        style={{ padding: 20 }}
      >
        <BoardSkeleton />
      </div>
    );

  if (boards && boards.length === 0) {
    return (
      <div
        className='app-container'
        style={{ textAlign: 'center', marginTop: 50 }}
      >
        <h2>Sin tableros</h2>
        <button
          onClick={() => createBoardMutation.mutate()}
          style={{
            padding: '10px',
            background: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
          }}
        >
          Inicializar Tablero
        </button>
      </div>
    );
  }

  const rawColumns = boards ? boards[0].columns : [];
  const filteredColumns = rawColumns.map((col: any) => ({
    ...col,
    tasks: col.tasks.filter((task: any) => {
      const matchesSearch = task.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    }),
  }));

  const isFiltering = searchQuery !== '' || priorityFilter !== 'all';

  const onDragEnd = (result: DropResult) => {
    if (isFiltering) {
      toast('Filtros activos: No mover', { icon: '🚫' });
      return;
    }
    if (!result.destination) return;

    if (result.type === 'COLUMN') {
      const newCols = [...rawColumns];
      const [movedCol] = newCols.splice(result.source.index, 1);
      newCols.splice(result.destination.index, 0, movedCol);
      queryClient.setQueryData(['boards', targetUserId], (old: any) => [
        { ...old[0], columns: newCols },
      ]);
      reorderColumns.mutate(newCols.map((c: any) => c.id));
      return;
    }
    moveTask.mutate({
      id: Number(result.draggableId),
      columnId: Number(result.destination.droppableId),
    });
  };

  return (
    <div
      className='app-container'
      style={{ height: '100%', overflow: 'hidden' }}
    >
      <header
        style={{ margin: 0, borderRadius: 10, borderBottom: '1px solid #ddd' }}
      >
        <div className='header-left'>
          <h1>
            📋 {targetUserId ? `Tablero (ID: ${targetUserId})` : 'Mi Tablero'}
          </h1>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>
            Visor: {myName} ({myRole})
          </span>
        </div>
        <div className='header-controls'>
          <input
            placeholder='🔍 Buscar...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: 150 }}
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value='all'>Todas</option>
            <option value='low'>🟢 Baja</option>
            <option value='medium'>🟠 Media</option>
            <option value='high'>🔴 Alta</option>
          </select>

          <div
            onClick={() => setShowProfile(true)}
            style={{
              width: 35,
              height: 35,
              borderRadius: '50%',
              background: '#4a90e2',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              cursor: 'pointer',
              border: '2px solid white',
              boxShadow: '0 0 0 2px #ddd',
            }}
            title='Editar mi perfil'
          >
            {myName.charAt(0).toUpperCase()}
          </div>
          <button onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div
        style={{ padding: 20, height: 'calc(100% - 70px)', overflowX: 'auto' }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable
            droppableId='board'
            direction='horizontal'
            type='COLUMN'
            isDropDisabled={isFiltering}
          >
            {(provided) => (
              <div
                className='board-columns'
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {filteredColumns.map((col: any, index: number) => (
                  <Draggable
                    key={col.id}
                    draggableId={`col-${col.id}`}
                    index={index}
                    isDragDisabled={isFiltering}
                  >
                    {(provided) => (
                      <div
                        className='column'
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                          }}
                        >
                          <h3>{col.title}</h3>
                          <div
                            {...provided.dragHandleProps}
                            style={{ cursor: 'grab', color: '#999' }}
                          >
                            <GripHorizontal size={20} />
                          </div>
                        </div>
                        <Droppable
                          droppableId={String(col.id)}
                          type='TASK'
                          isDropDisabled={isFiltering}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className='droppable-container'
                              style={{
                                minHeight: 50,
                                background: snapshot.isDraggingOver
                                  ? '#e3f2fd'
                                  : 'transparent',
                              }}
                            >
                              {col.tasks.map((task: any, index: number) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  index={index}
                                  onDelete={(id) => deleteTask.mutate(id)}
                                  onUpdate={(id, updates) =>
                                    updateTask.mutate({ id, updates })
                                  }
                                  // Al hacer click, guardamos el ID para que activeTask funcione
                                  onOpenChat={(t) => setSelectedTask(t)}
                                />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                        <button
                          className='add-task-btn'
                          onClick={() => handleNewTask(col.id)}
                        >
                          + Tarea
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* RENDERIZAMOS EL MODAL CON 'activeTask' (Datos en vivo) */}
      <TaskDetailModal
        isOpen={!!activeTask} // Se abre si encontramos la tarea
        task={activeTask || selectedTask} // Usamos activeTask preferentemente
        onClose={() => setSelectedTask(null)}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentUser={{ name: myName, email: '...' }}
        onUpdateSuccess={handleProfileUpdate}
      />
    </div>
  );
};

// --- COMPONENTE PRINCIPAL (APP) ---
function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  const role = localStorage.getItem('user_role');
  const myId = Number(localStorage.getItem('user_id'));

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    setSelectedUserId(myId);
  }, [myId]);

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => (await axios.get('http://localhost:3000/users')).data,
    enabled: role === 'ADMIN' && !!token,
  });

  const createUser = useMutation({
    mutationFn: (data: any) => axios.post('http://localhost:3000/users', data),
    onSuccess: () => {
      toast.success('Usuario creado');
      refetchUsers();
    },
    onError: () => toast.error('Error al crear (¿Email duplicado?)'),
  });

  const deleteUser = useMutation({
    mutationFn: (id: number) =>
      axios.delete(`http://localhost:3000/users/${id}`),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      refetchUsers();
      if (selectedUserId === null) setSelectedUserId(myId);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Error'),
  });

  const resetPassword = useMutation({
    mutationFn: (data: { id: number; newPassword: string }) =>
      axios.put(`http://localhost:3000/users/${data.id}/password`, {
        newPassword: data.newPassword,
      }),
    onSuccess: () => toast.success('Contraseña actualizada con éxito 🔑'),
    onError: () => toast.error('Error al actualizar contraseña'),
  });

  const handleLogin = () => {
    setToken(localStorage.getItem('token'));
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    toast('¡Nos vemos!', { icon: '👋' });
    window.location.reload();
  };

  if (!token) {
    return (
      <>
        <Toaster position='bottom-right' />
        <AuthScreen onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <Toaster position='bottom-right' />

      <div className='admin-layout'>
        {role === 'ADMIN' && (
          <AdminSidebar
            users={users || []}
            currentUserRole={role}
            selectedUserId={selectedUserId}
            onSelectUser={(id) => setSelectedUserId(id)}
            onCreateUser={(data) => createUser.mutate(data)}
            onDeleteUser={(id) => deleteUser.mutate(id)}
            onResetPassword={(id, newPass) =>
              resetPassword.mutate({ id, newPassword: newPass })
            }
            onOpenAnalytics={() => setShowAnalytics(true)}
          />
        )}

        <div className='main-content'>
          <TaskFlow
            onLogout={handleLogout}
            targetUserId={role === 'ADMIN' ? selectedUserId : null}
          />
        </div>
      </div>
      {/* RENDERIZAR MODAL DE ANALÍTICAS */}
      {role === 'ADMIN' && (
        <AnalyticsModal
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </>
  );
}

export default App;
