const basePath = self.location.pathname.replace('sw.js', '');
const CACHE_VERSION = 'v.30.04.3';  // Измените версию при обновлении
const CACHE_NAME = `infa-cache-${CACHE_VERSION}`;

const urlsToCache = [
  basePath,
  basePath + 'index.html',
  basePath + 'favicon-32x32.png',
  basePath + 'favicon-16x16.png',
  basePath + 'apple-touch-icon.png',
  basePath + 'android-chrome-192x192.png',
  basePath + 'android-chrome-512x512.png',
  basePath + 'logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
  
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(e => console.warn(`[SW] Failed to cache ${url}:`, e))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname === basePath || url.pathname === basePath + 'index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
    
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(fetchResponse => {
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
