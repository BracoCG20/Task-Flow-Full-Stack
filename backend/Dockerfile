# backend/Dockerfile


FROM node:20-alpine

# 2. Creamos la carpeta de trabajo
WORKDIR /app

# 3. Copiamos los archivos de dependencias
COPY package*.json ./

# 4. Instalamos dependencias
RUN npm install

# 5. Copiamos el resto del código fuente
COPY . .

# 6. Generamos el cliente de Prisma (necesario para la BD)
RUN npx prisma generate

# 7. Construimos el proyecto (TypeScript -> JavaScript)
RUN npm run build

# 8. Exponemos el puerto
EXPOSE 3000

# 9. Comando para iniciar en producción
CMD ["npm", "start"]