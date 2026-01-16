# 📋 TaskFlow - Full Stack Kanban App

TaskFlow Pro es una aplicación de gestión de tareas estilo Kanban (similar a Trello) construida con tecnologías modernas. Permite a los usuarios registrarse, crear tableros personales y gestionar tareas mediante una interfaz interactiva de arrastrar y soltar (Drag & Drop).

## 🚀 Tecnologías Utilizadas

### Frontend (Cliente)

- **React + Vite:** Para una interfaz rápida y reactiva.
- **TypeScript:** Para tipado estático y código robusto.
- **SASS:** Para estilos modulares y variables CSS.
- **React Query (TanStack Query):** Gestión de estado asíncrono y caché de datos.
- **Axios:** Cliente HTTP con interceptores para manejo de Tokens.
- **@hello-pangea/dnd:** Librería para la funcionalidad Drag & Drop.
- **React Hot Toast:** Notificaciones flotantes elegantes.
- **Lucide React:** Iconografía moderna.

### Backend (Servidor)

- **Node.js + Express:** Servidor REST API.
- **TypeScript:** Seguridad de tipos en el servidor.
- **PostgreSQL:** Base de datos relacional robusta.
- **Prisma ORM:** Manejo de base de datos y migraciones.
- **JWT (JSON Web Tokens):** Manejo de sesiones y seguridad.
- **Bcryptjs:** Encriptación (hashing) de contraseñas.
- **Cors:** Gestión de permisos de acceso cruzado.

---

## ✨ Funcionalidades Principales

1.  **Autenticación Segura:**
    - Registro de usuarios (con contraseñas hasheadas).
    - Login con generación de JWT.
    - Persistencia de sesión.
2.  **Gestión de Tableros (Kanban):**
    - Visualización de columnas (Pendiente, En Proceso, Terminado).
    - Creación de tareas en tiempo real.
3.  **Drag & Drop:**
    - Arrastrar tareas entre columnas actualiza su estado en la base de datos automáticamente.
4.  **Edición "In-Place":**
    - Doble clic en una tarea para editar su contenido.
    - Cambio de prioridad (Baja, Media, Alta) con indicadores visuales de color.
    - Asignación de fechas de vencimiento.
5.  **Feedback de Usuario:**
    - Notificaciones Toast para acciones exitosas o errores.
    - Interfaz limpia sin alertas nativas del navegador.

---

## 🛠️ Instalación y Ejecución

Sigue estos pasos para correr el proyecto localmente.

### 1. Prerrequisitos

- Node.js instalado.
- PostgreSQL instalado y corriendo.

### 2. Configuración Global

Clona el repositorio e instala las dependencias de todo el proyecto (Frontend, Backend y Raíz) con un solo comando:

```bash
npm run install:all
```

### 3. Base de Datos

Asegúrate de tener un archivo .env en la carpeta backend con la URL de tu base de datos local:

`DATABASE_URL="postgresql://usuario:password@localhost:5432/taskflow?schema=public"`

Ejecuta las migraciones para crear las tablas:

```
cd backend
npx prisma migrate dev --name init
cd ..
```

### 4. ¡Arrancar la App! 🚀

Desde la raíz del proyecto, ejecuta el comando mágico que levanta Frontend y Backend simultáneamente:

```bash
npm run dev
```

Esto abrirá:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### 📂 Estructura del Proyecto

```
/
├── package.json       # Scripts globales (concurrently)
├── frontend/          # Cliente React
│   ├── src/
│   │   ├── components/ # Componentes reutilizables (TaskCard, AuthScreen)
│   │   ├── styles.scss # Estilos globales SASS
│   │   └── App.tsx     # Lógica principal y Rutas
├── backend/           # API Express
│   ├── prisma/        # Esquema de Base de Datos
│   └── src/
│       └── index.ts   # Lógica del servidor y endpoints

```

### 🔒 Seguridad Implementada

Protección de Rutas: Middleware personalizado que verifica el JWT en cada petición (authenticateToken).

Aislamiento de Datos: Cada usuario solo puede ver y editar sus propios tableros y tareas mediante la validación del ownerId.

Validación: Se valida la existencia de datos antes de impactar la base de datos.
