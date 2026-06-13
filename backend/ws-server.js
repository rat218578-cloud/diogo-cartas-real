// backend/ws-server.js
import WebSocket, { WebSocketServer } from 'ws';
import evolutionAuth from './evolution-auth.js';
import signalListener from './signal-listener.js';

class WebSocketSignalServer {
  constructor(port = 3002) {
    this.port = port;
    this.wss = null;
    this.clients = new Map();
    this.activeSessions = new Map();
  }

  start() {
    this.wss = new WebSocketServer({ port: this.port });
    
    this.wss.on('connection', (ws) => {
      console.log('📱 Cliente conectado ao servidor de sinais');
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'auth') {
            await this.handleAuth(ws, message);
          } else if (message.type === 'subscribe') {
            this.handleSubscribe(ws, message);
          }
        } catch (error) {
          // Silencia erros
        }
      });
      
      ws.on('close', () => {
        this.removeClient(ws);
      });
    });
    
    signalListener.on('signal', (signal) => {
      this.broadcastSignal(signal);
    });
    
    console.log(`🚀 WebSocket rodando na porta ${this.port}`);
  }

  async handleAuth(ws, message) {
    const { email, password } = message;
    
    const result = await evolutionAuth.generateEVOSessionID(email, password);
    
    if (result.success) {
      if (!this.clients.has(result.sessionId)) {
        this.clients.set(result.sessionId, new Set());
      }
      this.clients.get(result.sessionId).add(ws);
      ws.sessionId = result.sessionId;
      
      if (!this.activeSessions.has(result.sessionId)) {
        await signalListener.listenToGame(result.sessionId);
        this.activeSessions.set(result.sessionId, true);
      }
      
      ws.send(JSON.stringify({
        type: 'auth_success',
        sessionId: result.sessionId,
        iframeUrl: result.iframeUrl
      }));
      
      console.log(`✅ Cliente autenticado`);
    } else {
      ws.send(JSON.stringify({
        type: 'auth_failed',
        error: result.error
      }));
    }
  }

  handleSubscribe(ws, message) {
    const { sessionId } = message;
    if (sessionId && this.clients.has(sessionId)) {
      this.clients.get(sessionId).add(ws);
      ws.sessionId = sessionId;
    }
  }

  removeClient(ws) {
    if (ws.sessionId && this.clients.has(ws.sessionId)) {
      this.clients.get(ws.sessionId).delete(ws);
      
      if (this.clients.get(ws.sessionId).size === 0) {
        signalListener.stopListening(ws.sessionId);
        this.activeSessions.delete(ws.sessionId);
      }
    }
  }

  broadcastSignal(signal) {
    this.wss?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'signal',
          data: signal
        }));
      }
    });
  }
}

export default WebSocketSignalServer;
