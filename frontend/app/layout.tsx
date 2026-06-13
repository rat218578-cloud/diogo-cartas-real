import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Football Studio Signals',
  description: 'Sinais em tempo real para Football Studio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
