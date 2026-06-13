FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependências
COPY package*.json ./
RUN npm ci || npm install

# Copiar código e build
COPY . .
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS runner

WORKDIR /app

# Copiar build do estágio anterior
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"]
