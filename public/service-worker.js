/**
 * Service Worker for Provably Fair Games PWA
 *
 * Caching strategy:
 * - Static assets: Cache-first (long-lived)
 * - API calls: Network-first (for fresh blockchain data)
 * - Navigation: Network-first with offline fallback
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `provably-fair-games-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Assets to cache as they're requested (runtime caching)
const RUNTIME_CACHE_PATTERNS = [
  /\.(?:js|css|woff2?)$/i,  // Scripts, styles, fonts
  /\/icons\//,              // All icons
  /\/static\//              // Vite build output
];

// Never cache these (always fetch fresh)
const NEVER_CACHE_PATTERNS = [
  /\/api\//,                // API calls need fresh data
  /ergo.*\.com/,            // Blockchain API
  /explorer\.ergoplatform/  // Block explorer
];

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching core assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Precache complete, skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('provably-fair-games-') && name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests we don't want to cache
  if (url.origin !== location.origin) {
    // Check if it's a blockchain API call (never cache)
    if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
      return;
    }
  }

  // Skip requests we should never cache
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      fetch(request).catch(() => {
        // For API calls, return a generic offline response
        if (request.url.includes('/api/')) {
          return new Response(
            JSON.stringify({ error: 'Offline', message: 'Network unavailable' }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
          );
        }
      })
    );
    return;
  }

  // Navigation requests - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Try cache, then fallback to index.html (SPA routing)
          return caches.match(request)
            .then((cachedResponse) => {
              return cachedResponse || caches.match('/index.html');
            });
        })
    );
    return;
  }

  // Static assets - cache first, then network
  if (RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(request.url))) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version, but also update cache in background
            fetch(request).then((networkResponse) => {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }).catch(() => {}); // Ignore network errors

            return cachedResponse;
          }

          // Not in cache, fetch and cache
          return fetch(request).then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          });
        })
    );
    return;
  }

  // Default: network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});

// Background sync for score submissions (when back online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncPendingScores());
  }
});

async function syncPendingScores() {
  // This would sync any scores that failed to submit while offline
  // For now, just log that sync was triggered
  console.log('[SW] Background sync triggered for scores');
}
