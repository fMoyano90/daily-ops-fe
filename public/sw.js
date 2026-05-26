// DailyOps service worker
// Bump CACHE_VERSION to invalidate caches when shell changes.
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `dailyops-static-${CACHE_VERSION}`
const PAGES_CACHE = `dailyops-pages-${CACHE_VERSION}`

const OFFLINE_URL = '/offline'

const PRECACHE = [
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((n) => !n.endsWith(CACHE_VERSION))
          .map((n) => caches.delete(n))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  )
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // Skip cross-origin (API en otro host se gestiona desde el cliente con IDB).
  if (url.origin !== self.location.origin) return

  // Static assets → stale-while-revalidate.
  // Sirve la copia cacheada al instante, pero siempre refresca en background
  // para que la próxima navegación tenga la versión nueva. Evita el clásico
  // "no veo mis cambios" cuando se bumpean los hashes de bundles.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE)
        const cached = await cache.match(request)
        const networkPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone()).catch(() => {})
            return res
          })
          .catch(() => null)
        return cached || (await networkPromise) || new Response(null, { status: 504 })
      })()
    )
    return
  }

  // HTML / navigation → network-first, fallback a página cacheada o /offline.
  if (isNavigationRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(PAGES_CACHE).then((c) => c.put(request, copy)).catch(() => {})
          return res
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          return caches.match(OFFLINE_URL)
        })
    )
    return
  }
})

// ── Push notifications ─────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'DailyOps', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'DailyOps'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [80, 40, 80],
    data: {
      url: data.url || '/today',
    },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/today'
  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        const clientUrl = new URL(client.url)
        if (clientUrl.origin === self.location.origin) {
          client.focus()
          if ('navigate' in client) {
            try {
              await client.navigate(targetUrl)
            } catch {}
          }
          return
        }
      }
      await self.clients.openWindow(targetUrl)
    })()
  )
})
