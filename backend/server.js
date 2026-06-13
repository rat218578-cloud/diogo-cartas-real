// backend/server.js
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import WebSocketSignalServer from './ws-server.js';
import evolutionAuth from './evolution-auth.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'diogo-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 3600000 }
}));

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  
  const result = await evolutionAuth.generateEVOSessionID(email, password);
  
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

const wsServer = new WebSocketSignalServer(3002);
wsServer.start();

app.listen(PORT, () => {
  console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:3002`);
});
