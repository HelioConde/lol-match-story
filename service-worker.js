// GitHub Pages uses the same origin for multiple games and products.
// Cache only LoL Match Story's public app shell; never evict another app's data.
const CACHE = 'lol-match-story-v4';
const CORE = [
  './', './index.html', './style.css', './visual-assets.css',
  './app.js', './i18n.js', './backend-config.js',
  './ads-config.js', './ads.js', './live-update.js',
  './manifest.webmanifest', './icon.svg',
  './story.html', './story-public.js'
];
const SCOPE = new URL(self.registration.scope);
const CORE_PATHS = new Set(CORE.map(file => new URL(file, self.registration.scope).pathname));

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith('lol-match-story-') && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE.pathname)) return;

  const isNavigation = event.request.mode === 'navigate';
  // Never cache query-bearing share links, Riot IDs or arbitrary same-origin responses.
  const canCache = !url.search && CORE_PATHS.has(url.pathname);
  if (!canCache && !isNavigation) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (canCache && response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      if (canCache) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
      }
      if (isNavigation) {
        const isStory = url.pathname === new URL('./story.html', self.registration.scope).pathname;
        const fallback = new URL(isStory ? './story.html' : './index.html', self.registration.scope).href;
        const shell = await caches.match(fallback);
        if (shell) return shell;
      }
      return Response.error();
    }
  })());
});
