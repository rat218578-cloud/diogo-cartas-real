FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production || npm install

# Copiar código fonte
COPY . .

# Expor portas
EXPOSE 3001 3002

# Iniciar servidor
CMD ["node", "server.js"]
