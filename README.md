# Diogo Cartas Real

Aplicação com backend Express/WebSocket e frontend Next.js para exibir sinais em tempo real do Football Studio.

## Estrutura

```text
diogo-cartas-real/
├── backend/
│   ├── package.json
│   ├── .env
│   ├── server.js
│   ├── evolution-auth.js
│   ├── signal-listener.js
│   ├── ws-server.js
│   ├── Dockerfile
│   └── railway.json
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   ├── railway.json
│   └── app/
│       ├── layout.tsx
│       ├── globals.css
│       ├── page.tsx
│       └── dashboard/
│           └── page.tsx
├── railway.json
├── railway.toml
├── nixpacks.toml
├── .railway/
│   └── config.json
├── docker-compose.yml
└── README.md
```

## Como executar localmente

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

Acesse: <http://localhost:3000>

## Deploy na Railway

### Arquivo principal

O projeto inclui `railway.json` na raiz para deploy completo com Nixpacks:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm install && cd ../frontend && npm install && npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "startCommand": "cd backend && node server.js"
  }
}
```

Também existem arquivos específicos em `backend/railway.json` e `frontend/railway.json`, além de alternativas com `railway.toml` e `nixpacks.toml`.

### Comandos Railway CLI

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login na Railway
railway login

# 3. Inicializar projeto
railway init

# 4. Linkar com o projeto
railway link

# 5. Fazer deploy
railway up

# 6. Abrir no navegador
railway open
```

### Variáveis de ambiente Railway

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set SESSION_SECRET=seu-secret-aqui-muito-seguro
railway variables set SORTENABET_URL=https://sortenabet.com
railway variables set EVOLUTION_URL=https://sortenabet.evo-games.com
```

## Docker Compose

```bash
docker compose up --build
```
