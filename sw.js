/* Académica Michelangelo · Service Worker v39.0
   Evita que index.html quede pegado a versiones antiguas en celulares.
*/

const SW_VERSION = "39.0";
const STATIC_CACHE = `academica-michelangelo-static-${SW_VERSION}`;
const RUNTIME_CACHE = `academica-michelangelo-runtime-${SW_VERSION}`;
const OFFLINE_HTML = "./__offline_latest__.html";

const STATIC_ASSETS = [
  "./manifest.webmanifest",
  "./logo.png",
  "./favicon.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();

    await Promise.all(
      names.map(name => {
        if(name !== STATIC_CACHE && name !== RUNTIME_CACHE){
          return caches.delete(name);
        }
      })
    );

    await self.clients.claim();
  })());
});

self.addEventListener("message", event => {
  if(event.data?.type === "SKIP_WAITING"){
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if(request.method !== "GET") return;

  const url = new URL(request.url);

  // No interferir con Firebase, Gemini u otros servicios externos.
  if(url.origin !== self.location.origin) return;

  const acceptsHtml = request.headers.get("accept")?.includes("text/html");
  const isNavigation = request.mode === "navigate" || acceptsHtml;

  // HTML / navegación: SIEMPRE intenta red primero.
  // Esto evita abrir una versión vieja de la plataforma desde caché.
  if(isNavigation){
    event.respondWith((async () => {
      try{
        const fresh = await fetch(request, {cache:"no-store"});

        if(fresh && fresh.ok){
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(OFFLINE_HTML, fresh.clone());
        }

        return fresh;
      }catch(err){
        const cached = await caches.match(OFFLINE_HTML);
        if(cached) return cached;

        return new Response(
          `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sin conexión</title><body style="font-family:system-ui;padding:32px;background:#f3efe6;color:#2f2923"><h2>Sin conexión</h2><p>No fue posible cargar Académica Michelangelo. Revisa tu conexión e inténtalo nuevamente.</p></body></html>`,
          {headers:{"Content-Type":"text/html; charset=utf-8"}}
        );
      }
    })());

    return;
  }

  // Archivos estáticos: caché rápida con actualización en segundo plano.
  event.respondWith((async () => {
    const cached = await caches.match(request);

    const networkPromise = fetch(request)
      .then(async response => {
        if(response && response.ok){
          const cache = await caches.open(STATIC_CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => null);

    return cached || await networkPromise || new Response("", {status:504});
  })());
});

// Soporte de notificaciones push sin depender de una copia antigua del SW.
self.addEventListener("push", event => {
  let payload = {};

  try{
    payload = event.data ? event.data.json() : {};
  }catch{
    try{
      payload = {notification:{body:event.data?.text() || ""}};
    }catch{}
  }

  const notification = payload.notification || {};
  const data = payload.data || {};

  const title =
    notification.title ||
    data.title ||
    "Académica Michelangelo";

  const options = {
    body: notification.body || data.body || "Tienes una nueva notificación.",
    icon: notification.icon || "./logo.png",
    badge: notification.badge || "./logo.png",
    tag: data.tag || notification.tag || "academica-michelangelo",
    data: {
      url: data.url || "./"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "./";

  event.waitUntil((async () => {
    const clientList = await clients.matchAll({
      type:"window",
      includeUncontrolled:true
    });

    for(const client of clientList){
      if("focus" in client){
        await client.focus();

        if("navigate" in client){
          try{
            await client.navigate(targetUrl);
          }catch{}
        }

        return;
      }
    }

    if(clients.openWindow){
      return clients.openWindow(targetUrl);
    }
  })());
});