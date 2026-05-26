import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export const metadata = {
  title: 'DailyOps — Sin conexión',
}

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center px-6 safe-pt safe-pb">
      <div className="max-w-sm text-center space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-bg-muted flex items-center justify-center">
          <WifiOff className="w-7 h-7 text-text-muted" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-text">Sin conexión</h1>
          <p className="text-sm text-text-muted mt-1">
            No pudimos contactar al servidor. Algunos datos previos pueden seguir disponibles desde caché.
          </p>
        </div>
        <Link
          href="/today"
          className="inline-flex items-center px-4 py-2 bg-accent text-accent-fg rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors touch-target"
        >
          Reintentar
        </Link>
      </div>
    </main>
  )
}
