// backend/server.js
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import WebSocketSignalServer from './ws-server.js';
import evolutionAuth from './evolution-auth.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'https://diogo-cartas-real-production.up.railway.app', 'https://*.railway.app'],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'diogo-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 3600000 }
}));

// ✅ ROTA RAIZ - API Status
app.get('/', (req, res) => {
  res.json({
    message: 'Diogo Cartas API - Backend rodando!',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      login: 'POST /api/login',
      checkSession: 'GET /api/check-session',
      logout: 'POST /api/logout'
    }
  });
});

// ✅ SERVE OS ARQUIVOS ESTÁTICOS DO FRONTEND (se existir)
const frontendPath = path.join(__dirname, '../frontend/out');
app.use(express.static(frontendPath));

// ✅ FALlBACK para SPA - qualquer rota não encontrada vai para o frontend
app.get('*', (req, res, next) => {
  // Se a rota não for da API, tenta servir o index.html do frontend
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  } else {
    next();
  }
});

// API Routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  const result = await evolutionAuth.generateEVOSESSIONID(email, password);
  
  if (result.success) {
    req.session.userEmail = email;
    req.session.evoSessionId = result.sessionId;
    
    res.json({
      success: true,
      sessionId: result.sessionId,
      iframeUrl: result.iframeUrl,
      user: { email: email }
    });
  } else {
    res.status(401).json({
      success: false,
      error: result.error
    });
  }
});

app.get('/api/check-session', (req, res) => {
  if (req.session.evoSessionId) {
    res.json({
      loggedIn: true,
      sessionId: req.session.evoSessionId,
      userEmail: req.session.userEmail
    });
  } else {
    res.json({ loggedIn: false });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// WebSocket Server
const wsServer = new WebSocketSignalServer(3002);
wsServer.start();

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:3002`);
  console.log(`✅ Backend rodando e servindo frontend (se disponível)`);
});
