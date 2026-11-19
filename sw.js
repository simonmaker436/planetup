// sw.js — Permite abrir la app sin internet una vez instalada.
// Si cambias archivos, sube el número de versión para que se actualice.
const VERSION = 'planetup-v3';
const ARCHIVOS = [
  './', 'index.html', 'css/styles.css', 'manifest.json', 'fonts/jakarta.woff2',
  'js/data.js', 'js/store.js', 'js/logic.js', 'js/fx.js', 'js/tarjeta.js', 'js/ui.js', 'js/app.js', 'js/globe.js',
  'vendor/three.min.js', 'img/earth/day.jpg', 'img/earth/night.jpg', 'img/earth/clouds.jpg',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
]; // las imágenes 3D se guardan solas la primera vez que se ven

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Primero internet (para tener lo último); si no hay, usa la copia guardada
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const copia = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copia)); return res; })
      .catch(() => caches.match(e.request))
  );
});
