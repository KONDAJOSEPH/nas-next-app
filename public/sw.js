// Nas Transaction Company: service worker. Keeps the app working offline and wakes the app for Background Sync.
const V = 'nas-next-v1';   // change to nas-next-v2 etc. after you publish a new version

self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
  await self.clients.claim();
})()));

// The app asks us to save every page and its files right after the first online visit.
self.addEventListener('message', e => { if (e.data && e.data.type === 'warm') e.waitUntil(warm(e.data.routes || [])); });
async function warm(routes) {
  const c = await caches.open(V), assets = new Set();
  for (const r of routes) {
    try {
      const res = await fetch(r); if (!res.ok) continue;
      await c.put(r, res.clone());
      const html = await res.text();
      (html.match(/\/_next\/[^"'\\\s)<>]+/g) || []).forEach(a => assets.add(a));
    } catch (_) {}
  }
  for (const a of assets) {
    try { if (!(await c.match(a))) { const res = await fetch(a); if (res.ok) await c.put(a, res); } } catch (_) {}
  }
}

// Saved copy first (fast on weak networks), refreshed in the background.
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r, { ignoreSearch: u.pathname.endsWith('.txt') });
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => null);
    return hit || (await net) || (r.mode === 'navigate' ? await c.match('/') : null) || new Response('Offline', { status: 503 });
  }));
});

// Background Sync API: when the connection returns, ask the open app to push its queue.
self.addEventListener('sync', e => {
  if (e.tag === 'nas-sync') e.waitUntil(self.clients.matchAll({ includeUncontrolled: true }).then(cs => cs.forEach(c => c.postMessage({ type: 'nas-sync' }))));
});

// Phone notifications: tapping one opens the app. The push handler is for server-sent alerts (Web Push), added with the backend.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window' }).then(cs => (cs.length ? cs[0].focus() : self.clients.openWindow('/'))));
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(d.title || 'Nas Transaction Company', { body: d.body || 'You have a new update.', icon: '/icon-192.png' }));
});
