// Offline support. The app's files are stored at install; after that each launch asks the network first
// (so a new version shows up at once) and falls back to the stored copy when there is no signal or the
// signal is too slow (gym). Bump VERSION whenever the list of files changes.
const VERSION = 'fitplan-v1';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'logic.js', 'store.js', 'seed.js', 'firebase-config.js',
  'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/'; // same version as store.js
const SDK_FILES = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => SDK + f);

self.addEventListener('install', e => e.waitUntil((async () => {
  const cache = await caches.open(VERSION);
  await cache.addAll(FILES);
  await Promise.all(SDK_FILES.map(u => cache.add(u).catch(() => {}))); // not needed in local mode
  await self.skipWaiting();
})()));

self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const own = url.origin === location.origin, sdk = req.url.startsWith(SDK);
  if (!own && !sdk) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const cached = await cache.match(req, { ignoreSearch: own });
    if (sdk && cached) return cached; // versioned URL, never changes
    const fresh = fetch(req);
    // keep the worker alive until the new copy is stored, even if the cached one was already returned
    e.waitUntil(fresh.then(res => res.ok ? cache.put(req, res.clone()) : null).catch(() => {}));
    if (!cached) return fresh;
    const slow = new Promise(resolve => setTimeout(() => resolve(cached), 3000));
    return Promise.race([fresh.catch(() => cached), slow]);
  })());
});
