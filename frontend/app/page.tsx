'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/check-session', {
          credentials: 'include'
        })
        const data = await response.json()
        
        if (data.loggedIn && data.sessionId) {
          localStorage.setItem('evo_session_id', data.sessionId)
          localStorage.setItem('user_email', data.userEmail)
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
      }
    }
    
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('evo_session_id', data.sessionId)
        localStorage.setItem('iframe_url', data.iframeUrl)
        localStorage.setItem('user_email', email)
        router.push('/dashboard')
      } else {
        setError(data.error || 'Email ou senha inválidos')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Football Studio</h1>
          <p className="text-gray-400 mt-2">Sinais em Tempo Real</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email da Sorte na Bet"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white"
            required
          />
          
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-white transition disabled:opacity-50"
          >
            {loading ? 'Autenticando...' : '🎮 Entrar e Jogar'}
          </button>
        </form>
      </div>
    </div>
  )
}
