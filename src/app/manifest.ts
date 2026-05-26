import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DailyOps — Organiza tu día',
    short_name: 'DailyOps',
    description: 'Planifica, ejecuta y mide tu trabajo diario',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es',
    background_color: '#09090b',
    theme_color: '#7c3aed',
    categories: ['productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-256.png',
        sizes: '256x256',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Today',
        short_name: 'Today',
        description: 'Ver tareas de hoy',
        url: '/today',
      },
      {
        name: 'Add Task',
        short_name: 'Nueva',
        description: 'Agregar tarea nueva',
        url: '/add-task',
      },
      {
        name: 'Backlog',
        short_name: 'Backlog',
        description: 'Ver backlog',
        url: '/backlog',
      },
    ],
  }
}
