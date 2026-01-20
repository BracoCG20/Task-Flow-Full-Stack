# 📋 TaskFlow Pro - Enterprise Full Stack Kanban App

TaskFlow Pro es una aplicación de gestión de proyectos y tareas estilo Kanban (similar a Jira o Trello) construida con tecnologías modernas y escalables. Ha evolucionado de un simple tablero a una **Suite Empresarial Completa** que incluye roles de usuario, auditoría, análisis de datos y colaboración en tiempo real.

## 🚀 Tecnologías Utilizadas

### Frontend (Cliente)

- **React + Vite:** Para una interfaz rápida y reactiva.
- **TypeScript:** Para tipado estático y código robusto.
- **SASS:** Para estilos modulares y diseño responsivo.
- **React Query (TanStack Query):** Gestión de estado asíncrono, caché y "Live Data".
- **Axios:** Cliente HTTP con interceptores para manejo de Tokens.
- **@hello-pangea/dnd:** Librería profesional para Drag & Drop.
- **Recharts:** Visualización de datos y gráficos analíticos.
- **React Hot Toast:** Notificaciones flotantes elegantes.
- **Lucide React:** Iconografía moderna.

### Backend (Servidor)

- **Node.js + Express:** Servidor REST API.
- **TypeScript:** Seguridad de tipos en el servidor.
- **PostgreSQL:** Base de datos relacional robusta.
- **Prisma ORM:** Manejo de base de datos, relaciones complejas y migraciones.
- **Multer:** Gestión de carga de archivos (Archivos adjuntos).
- **JWT (JSON Web Tokens):** Manejo de sesiones y seguridad.
- **Bcryptjs:** Encriptación (hashing) de contraseñas.
- **Cors:** Gestión de permisos de acceso cruzado.

---

## ✨ Funcionalidades Principales

### 🔐 Seguridad y Roles (RBAC)

- **Roles de Usuario:** Diferenciación entre `ADMIN` y `USER`.
- **Panel de Administración:**
  - Gestión de empleados (CRUD completo).
  - Creación de usuarios con contraseña inicial.
  - Reset de contraseñas de usuarios.
  - Capacidad de "Ver como..." (El admin puede inspeccionar tableros de empleados).
- **Autenticación:** Login seguro con JWT y protección de rutas middleware.

### 📊 Tablero Kanban Dinámico

- **Columnas Personalizables:** Crear, Editar título, Reordenar y Eliminar columnas libremente.
- **Drag & Drop Fluido:** Arrastrar tareas entre columnas y reordenar dentro de la misma lista.
- **Persistencia:** Todo movimiento se guarda automáticamente en base de datos.

### 📝 Gestión Avanzada de Tareas

- **Detalles Completos:** Modal con información detallada.
- **Etiquetas (Tags):** Sistema de categorización por colores (ej: Urgente, Bug, Frontend).
- **Checklists (Subtareas):**
  - Creación de items dentro de una tarea.
  - Barra de progreso visual en la tarjeta (ej: 2/5 completadas).
- **Archivos Adjuntos:** Subida de imágenes y documentos a las tareas (almacenamiento local).

### 🤝 Colaboración y Auditoría

- **Comentarios en vivo:** Chat interno por tarea para el equipo.
- **Historial de Actividad (Audit Log):** Registro automático de quién hizo qué y cuándo (ej: _"Juan movió la tarea a 'Hecho' - hace 5 min"_).
- **Perfiles:** Avatares generados por iniciales y edición de perfil propio.

### 📈 Analíticas (Dashboard)

- Gráficos visuales para el Administrador.
- Métricas de productividad por usuario.
- Distribución de tareas por prioridad.

---

## 🛠️ Instalación y Ejecución

Sigue estos pasos para desplegar el proyecto localmente.

### 1. Prerrequisitos

- Node.js instalado.
- PostgreSQL instalado y corriendo.

### 2. Configuración Global

Clona el repositorio e instala las dependencias (Frontend y Backend):

```bash
# Instalar dependencias en raíz, backend y frontend
npm run install:all
```

(Si no tienes el script install:all, entra a cada carpeta cd frontend && npm i y cd backend && npm i).

### 3. Base de Datos

Crea un archivo .env en la carpeta backend con tus credenciales:

```bash
# Fragmento de código

DATABASE_URL="postgresql://tu_usuario:tu_password@localhost:5432/taskflow?schema=public"
JWT_SECRET="tu_clave_secreta_super_segura"

```

```Bash
# Ejecuta las migraciones para crear las tablas en PostgreSQL:
cd backend
npx prisma generate
npx prisma db push 4. Crear el Primer Administrador 👑
```

```Bash
# Como el registro público está desactivado por seguridad, debes inyectar el primer admin:

# Estando en la carpeta backend

npx ts-node seedAdmin.ts
Credenciales por defecto: admin@empresa.com / admin123
```

### 5. ¡Arrancar la App! 🚀

Desde la raíz del proyecto:

```Bash

npm run dev
Esto abrirá:

Frontend: http://localhost:5173

Backend: http://localhost:3000
```

### 📂 Estructura del Proyecto

```
/
├── package.json # Scripts globales
├── frontend/ # Cliente React (Vite)
│ ├── src/
│ │ ├── components/ # UI: TaskCard, Modals, AdminSidebar, Charts
│ │ ├── styles.scss # Estilos SASS
│ │ └── App.tsx # Router y Lógica Principal
├── backend/ # API Express
│ ├── prisma/ # Schema.prisma (Modelos DB)
│ ├── uploads/ # Almacenamiento de archivos adjuntos
│ └── src/
│ └── index.ts # Endpoints y Lógica de Negocio

```

### 🔒 Seguridad Implementada

- **Middleware authenticateToken:** Valida que el request tenga un Token válido.

- **Middleware requireAdmin:** Protege rutas críticas (borrar usuarios, ver estadísticas).

- **Aislamiento de Datos:** Validaciones en backend para asegurar que un usuario normal solo modifique sus propios datos.

- **Uploads Seguros:** Renombrado automático de archivos adjuntos para evitar colisiones.
