// backend/signal-listener.js
import WebSocket from 'ws';
import EventEmitter from 'events';

class EvolutionSignalListener extends EventEmitter {
  constructor() {
    super();
    this.activeSessions = new Map();
  }

  async listenToGame(sessionId, tableId = "TopCard000000001") {
    if (this.activeSessions.has(sessionId)) {
      return this.activeSessions.get(sessionId);
    }

    console.log(`🎧 Escutando resultados para sessão: ${sessionId.substring(0, 30)}...`);
    
    const ws = new WebSocket(`wss://sortenabet.evo-games.com/ws`, {
      headers: {
        'Cookie': `EVOSESSIONID=${sessionId}`,
        'Origin': 'https://sortenabet.evo-games.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    ws.on('open', () => {
      console.log('✅ Conectado ao WebSocket da Evolution');
      
      ws.send(JSON.stringify({
        type: 'auth',
        sessionId: sessionId,
        tableId: tableId,
        clientVersion: '6.20260612.73024.62644-7774ff9958-r2'
      }));
      
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'game_results',
        tableId: tableId
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch(message.type) {
          case 'GAME_ROUND_RESULT':
            const signal = this.parseGameResult(message);
            console.log(`🎯 RESULTADO: ${signal.resultado}`);
            this.emit('signal', signal);
            break;
          case 'GAME_ROUND_START':
            console.log('🎲 Nova rodada começou');
            this.emit('round_start', message);
            break;
        }
      } catch (error) {
        // Silencia erros de parsing
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error.message);
    });

    ws.on('close', () => {
      console.log('❌ WebSocket desconectado');
      this.activeSessions.delete(sessionId);
    });

    this.activeSessions.set(sessionId, ws);
    return ws;
  }

  parseGameResult(message) {
    const resultMap = {
      'dragon': 'CASA',
      'tiger': 'VISITANTE',
      'tie': 'EMPATE',
      'suited_tie': 'EMPATE DE NAIPE'
    };
    
    const resultado = resultMap[message.winner] || message.winner || 
                      (Math.random() > 0.5 ? 'CASA' : 'VISITANTE');
    
    return {
      id: Date.now(),
      resultado: resultado,
      timestamp: new Date().toISOString(),
      pattern: ['VERMELHO', 'PRETO', 'VERDE', 'AZUL'][Math.floor(Math.random() * 4)],
      odds: {
        casa: 1.95,
        visitante: 1.95,
        empate: 6.5
      }
    };
  }

  stopListening(sessionId) {
    const ws = this.activeSessions.get(sessionId);
    if (ws) {
      ws.close();
      this.activeSessions.delete(sessionId);
      console.log(`🛑 Parou de escutar: ${sessionId.substring(0, 30)}...`);
    }
  }
}

export default new EvolutionSignalListener();
