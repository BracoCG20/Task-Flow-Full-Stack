import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import toast from 'react-hot-toast';
import { GripHorizontal, Moon, Sun } from 'lucide-react';
import { io } from 'socket.io-client';

// Contextos y API
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';

// Componentes UI
import { TaskCard } from '../components/TaskCard';
import { BoardSkeleton } from '../components/BoardSkeleton';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { ProfileModal } from '../components/ProfileModal';
import { ColumnHeader } from '../components/ColumnHeader';
import { CreateTaskModal } from '../components/CreateTaskModal';

interface Props {
  onLogout: () => void;
  targetUserId: number | null;
}

export const BoardPage = ({ onLogout, targetUserId }: Props) => {
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();

  // Estados Locales
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [creatingColumnId, setCreatingColumnId] = useState<number | null>(null);

  const [myName, setMyName] = useState(localStorage.getItem('user_name') || '');
  const myRole = localStorage.getItem('user_role');

  const handleProfileUpdate = (name: string) => {
    localStorage.setItem('user_name', name);
    setMyName(name);
  };

  // --- WEBSOCKETS SETUP ---
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socket.on('connect', () => {
      console.log('⚡ Conectado a WebSocket');
    });

    socket.on('board:update', () => {
      console.log('🔄 Actualización recibida del servidor');
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // --- QUERY PRINCIPAL ---
  const { data: boards, isLoading } = useQuery({
    queryKey: ['boards', targetUserId],
    queryFn: async () => {
      const url = targetUserId ? `/boards?userId=${targetUserId}` : '/boards';
      return (await api.get(url)).data;
    },
    refetchOnWindowFocus: false,
  });

  // --- MUTACIONES ---
  const addColumn = useMutation({
    mutationFn: (title: string) =>
      api.post(`/boards/${boards[0].id}/columns`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Lista creada');
    },
  });

  const deleteColumn = useMutation({
    mutationFn: (id: number) => api.delete(`/columns/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const updateColumnTitle = useMutation({
    mutationFn: (data: { id: number; title: string }) =>
      api.patch(`/columns/${data.id}`, { title: data.title }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const reorderColumns = useMutation({
    mutationFn: (columnIds: number[]) =>
      api.put('/columns/reorder', { columnIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const addTask = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Tarea agregada exitosamente');
      setCreatingColumnId(null);
    },
  });

  const moveTask = useMutation({
    mutationFn: (data: any) =>
      api.patch(`/tasks/${data.id}`, { columnId: data.columnId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boards'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast('Tarea eliminada', { icon: '🗑️' });
    },
  });

  const updateTask = useMutation({
    mutationFn: (data: { id: number; updates: any }) =>
      api.patch(`/tasks/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('Guardado');
    },
  });

  const createBoardMutation = useMutation({
    mutationFn: async () => api.post('/boards', { title: 'Nuevo Tablero' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      toast.success('¡Tablero creado!');
    },
  });

  // --- HELPERS ---
  const handleNewColumn = () => {
    const title = prompt('Nombre de la nueva lista:');
    if (title) addColumn.mutate(title);
  };

  const handleNewTask = (columnId: number) => {
    setCreatingColumnId(columnId);
  };

  const handleCreateTaskSubmit = (data: {
    content: string;
    priority: string;
    dueDate: string;
  }) => {
    if (creatingColumnId === null) return;
    addTask.mutate({
      content: data.content,
      columnId: creatingColumnId,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    });
  };

  // --- FILTROS Y DATOS ACTIVOS ---

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

  // 🛡️ MEMOIZACIÓN ROBUSTA: Busca la tarea fresca, si no, usa la anterior (para evitar cierres)
  const activeTask = useMemo(() => {
    if (!selectedTask || !boards) return null;
    const freshTask = boards[0]?.columns
      .flatMap((col: any) => col.tasks)
      .find((t: any) => t.id === selectedTask.id);
    return freshTask || selectedTask;
  }, [selectedTask, boards]);

  // --- DRAG AND DROP ---
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

  // --- RENDER ---
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

  return (
    <div
      className='app-container'
      style={{ height: '100%' }}
    >
      <header
        className='app-header'
        style={{
          margin: 0,
          borderRadius: 10,
          borderBottom: '1px solid var(--border-color)',
        }}
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

          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-color)',
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

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
                          {...provided.dragHandleProps}
                          style={{
                            cursor: 'grab',
                            marginBottom: 5,
                            display: 'flex',
                            justifyContent: 'center',
                          }}
                        >
                          <GripHorizontal
                            size={20}
                            color='#ccc'
                          />
                        </div>

                        <ColumnHeader
                          id={col.id}
                          title={col.title}
                          taskCount={col.tasks.length}
                          onDelete={(id) => deleteColumn.mutate(id)}
                          onUpdateTitle={(id, t) =>
                            updateColumnTitle.mutate({ id, title: t })
                          }
                        />

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

                {!isFiltering && (
                  <div style={{ minWidth: 280, marginTop: 10 }}>
                    <button
                      onClick={handleNewColumn}
                      style={{
                        width: '100%',
                        padding: 15,
                        background: 'rgba(255,255,255,0.5)',
                        border: '2px dashed #ccc',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: '#666',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                      }}
                    >
                      + Añadir otra lista
                    </button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <TaskDetailModal
        isOpen={!!activeTask}
        task={activeTask || selectedTask}
        onClose={() => setSelectedTask(null)}
      />

      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        currentUser={{ name: myName, email: '...' }}
        onUpdateSuccess={handleProfileUpdate}
      />

      <CreateTaskModal
        isOpen={!!creatingColumnId}
        onClose={() => setCreatingColumnId(null)}
        onSubmit={handleCreateTaskSubmit}
      />
    </div>
  );
};
