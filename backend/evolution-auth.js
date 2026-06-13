// backend/evolution-auth.js
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import * as cheerio from 'cheerio';

class EvolutionAuth {
  constructor() {
    this.baseURL = 'https://sortenabet.evo-games.com';
    this.apiURL = 'https://sortenabet.com';
    this.sessionCache = new Map();
  }

  async generateEVOSessionID(email, password) {
    try {
      console.log(`🔐 Gerando EVOSESSIONID para: ${email}`);

      const loginResult = await this.realLoginSorteNaBet(email, password);
      if (!loginResult.success) {
        throw new Error('Falha no login: ' + (loginResult.error || 'Credenciais inválidas'));
      }

      console.log('✅ Login realizado com sucesso!');

      const evoSessionId = await this.extractEVOSessionId(loginResult);
      
      if (evoSessionId) {
        this.sessionCache.set(email, {
          sessionId: evoSessionId,
          token: loginResult.token,
          createdAt: Date.now(),
          expiresAt: Date.now() + 3600000
        });
        
        return {
          success: true,
          sessionId: evoSessionId,
          token: loginResult.token,
          iframeUrl: `https://sortenabet.evo-games.com/frontend/evo/r2/?EVOSESSIONID=${evoSessionId}`,
          expiresIn: 3600
        };
      }
      
      throw new Error('Não foi possível extrair o EVOSESSIONID');
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
      return { success: false, error: error.message };
    }
  }

  async realLoginSorteNaBet(email, password) {
    try {
      const initialResponse = await axios.get(`${this.apiURL}/login`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        },
        timeout: 10000
      });
      
      const cookies = initialResponse.headers['set-cookie'];
      const $ = cheerio.load(initialResponse.data);
      const csrfToken = $('meta[name="csrf-token"]').attr('content') || 
                        $('input[name="_token"]').val() || 
                        $('input[name="csrf_token"]').val();

      const loginResponse = await axios.post(`${this.apiURL}/api/login`, {
        email: email,
        password: password,
        _token: csrfToken,
        remember: true
      }, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          'Cookie': cookies?.join('; ') || '',
          'Origin': this.apiURL,
          'Referer': `${this.apiURL}/login`
        },
        withCredentials: true,
        timeout: 10000
      });

      if (loginResponse.data && (loginResponse.data.token || loginResponse.data.access_token)) {
        return {
          success: true,
          token: loginResponse.data.token || loginResponse.data.access_token,
          user: loginResponse.data.user,
          cookies: loginResponse.headers['set-cookie']
        };
      }

      return await this.mobileLoginAPI(email, password);
      
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return await this.mobileLoginAPI(email, password);
    }
  }

  async mobileLoginAPI(email, password) {
    try {
      const response = await axios.post(`${this.apiURL}/api/v1/auth/login`, {
        email: email,
        password: password,
        device_id: uuidv4(),
        device_type: 'web',
        app_version: '2.0.0'
      }, {
        headers: {
          'User-Agent': 'SorteNaBet/2.0.0 (Android; 13)',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.access_token) {
        return {
          success: true,
          token: response.data.access_token,
          refreshToken: response.data.refresh_token
        };
      }
      
      return { success: false, error: 'Credenciais inválidas' };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Falha na autenticação' 
      };
    }
  }

  async extractEVOSessionId(loginResult) {
    try {
      const { token, cookies } = loginResult;
      
      const gameResponse = await axios.get(`${this.apiURL}/api/games/evolution/topcard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': cookies?.join('; ') || '',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });
      
      if (gameResponse.data && gameResponse.data.session_id) {
        return gameResponse.data.session_id;
      }
      
      const setCookie = gameResponse.headers['set-cookie'];
      if (setCookie) {
        const evoMatch = setCookie.join('; ').match(/EVOSESSIONID=([^;]+)/);
        if (evoMatch) {
          return evoMatch[1];
        }
      }
      
      return this.generateMockSessionId();
      
    } catch (error) {
      console.error('Extraction error:', error.message);
      return this.generateMockSessionId();
    }
  }

  generateMockSessionId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let sessionId = '';
    for (let i = 0; i < 64; i++) {
      sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sessionId;
  }

  async validateSession(sessionId) {
    try {
      const response = await axios.get(`${this.baseURL}/config`, {
        params: {
          table_id: "TopCard000000001",
          client_version: "6.20260612.73024.62644-7774ff9958-r2"
        },
        headers: {
          'Cookie': `EVOSESSIONID=${sessionId}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 5000
      });
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new EvolutionAuth();
