const CACHE="michelangelo-ii-medio-v31-0";

const ASSETS=[
  "./",
  "./index.html",
  "./logo.png",
  "./manifest.webmanifest"
];

importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey:"AIzaSyDL3ziFbr1borIZsSo1Rjnp_AYdc3bR3yk",
  authDomain:"registroevaluaciones.firebaseapp.com",
  projectId:"registroevaluaciones",
  storageBucket:"registroevaluaciones.firebasestorage.app",
  messagingSenderId:"60342850123",
  appId:"1:60342850123:web:fe462b6bb326b5818e73ce"
});

const messaging=firebase.messaging();

messaging.onBackgroundMessage(payload=>{
  console.log(
    "[FCM] Mensaje recibido en segundo plano:",
    payload?.data?.type || "notification"
  );
});

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(
        keys
          .filter(key=>key!==CACHE)
          .map(key=>caches.delete(key))
      ))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;

  const url=new URL(event.request.url);

  if(
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("gstatic.com")
  ){
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();

        caches.open(CACHE)
          .then(cache=>cache.put(event.request,copy));

        return response;
      })
      .catch(()=>
        caches.match(event.request)
          .then(cached=>
            cached ||
            caches.match("./index.html")
          )
      )
  );
});