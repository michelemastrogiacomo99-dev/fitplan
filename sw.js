// Offline support. The app's files are stored at install; after that each launch asks the network first
// (so a new version shows up at once) and falls back to the stored copy when there is no signal or the
// signal is too slow (gym). Bump VERSION whenever the list of files changes.
const VERSION = 'fitplan-v3';
const PHOTOS = 'fitplan-photos'; // dish photos, kept across versions
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'logic.js', 'store.js', 'seed.js', 'images.js', 'firebase-config.js',
  'manifest.webmanifest', 'icon-180.png', 'icon-512.png'];
const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/'; // same version as store.js
const SDK_FILES = ['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => SDK + f);

self.addEventListener('install', e => e.waitUntil((async () => {
  const cache = await caches.open(VERSION);
  // 'reload' / 'no-cache' below: always ask the server, never the browser's own HTTP cache, so the app's
  // files cannot end up half old and half new right after an update
  await cache.addAll(FILES.map(f => new Request(f, { cache: 'reload' })));
  await Promise.all(SDK_FILES.map(u => cache.add(u).catch(() => {}))); // not needed in local mode
  await self.skipWaiting();
})()));

self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION && k !== PHOTOS) await caches.delete(k);
  await self.clients.claim();
})()));

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const own = url.origin === location.origin, sdk = req.url.startsWith(SDK), photo = url.hostname === 'images.unsplash.com';
  if (!own && !sdk && !photo) return;
  e.respondWith((async () => {
    const cache = await caches.open(photo ? PHOTOS : VERSION);
    const cached = await cache.match(req, { ignoreSearch: own });
    if ((sdk || photo) && cached) return cached; // these URLs never change
    const fresh = own ? fetch(req.url, { cache: 'no-cache' }) : fetch(req);
    // keep the worker alive until the new copy is stored, even if the cached one was already returned
    e.waitUntil(fresh.then(res => res.ok ? cache.put(req, res.clone()) : null).catch(() => {}));
    if (!cached) return fresh;
    const slow = new Promise(resolve => setTimeout(() => resolve(cached), 3000));
    return Promise.race([fresh.catch(() => cached), slow]);
  })());
});
