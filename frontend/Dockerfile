# frontend/Dockerfile

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Construimos la app (crea la carpeta dist/)
RUN npm run build

# Exponemos el puerto de Vite Preview
EXPOSE 4173

# Corremos el servidor de preview en host 0.0.0.0 para que Docker lo vea
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]