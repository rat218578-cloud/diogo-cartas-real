'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Signal {
  id: number
  resultado: string
  timestamp: string
  pattern?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [iframeUrl, setIframeUrl] = useState('')
  const [signals, setSignals] = useState<Signal[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const storedUrl = localStorage.getItem('iframe_url')
    const storedSession = localStorage.getItem('evo_session_id')
    
    if (!storedUrl || !storedSession) {
      router.push('/')
      return
    }
    
    setIframeUrl(storedUrl)
    
    const ws = new WebSocket('ws://localhost:3002')
    
    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({
        type: 'auth',
        sessionId: storedSession
      }))
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'signal') {
        setSignals(prev => [data.data, ...prev].slice(0, 50))
      }
    }
    
    ws.onclose = () => setConnected(false)
    
    return () => ws.close()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Football Studio Signals</h1>
        <div className={`px-3 py-1 rounded-full text-sm ${connected ? 'bg-green-500' : 'bg-red-500'}`}>
          {connected ? 'Conectado' : 'Desconectado'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
        <div className="lg:col-span-1 bg-gray-800 rounded-lg p-4 h-[calc(100vh-120px)] overflow-y-auto">
          <h2 className="text-white font-bold mb-4">Sinais em Tempo Real</h2>
          {signals.length === 0 && (
            <div className="text-gray-500 text-center py-8">Aguardando sinais...</div>
          )}
          {signals.map((signal, idx) => (
            <div key={idx} className={`p-3 rounded-lg mb-2 ${
              signal.resultado === 'CASA' ? 'bg-green-900/50' :
              signal.resultado === 'VISITANTE' ? 'bg-red-900/50' : 'bg-yellow-900/50'
            }`}>
              <div className="text-white font-bold">{signal.resultado}</div>
              <div className="text-xs text-gray-400">
                {new Date(signal.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
        
        <div className="lg:col-span-3 bg-black rounded-lg overflow-hidden h-[calc(100vh-120px)]">
          {iframeUrl && (
            <iframe
              src={iframeUrl}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
            />
          )}
        </div>
      </div>
    </div>
  )
}
