const CACHE="michelangelo-evaluaciones-v25-8";
const ASSETS=[
  "./",
  "./index.html",
  "./logo.png",
  "./favicon.ico",
  "./favicon.png",
  "./manifest.webmanifest"
];

importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js");

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
  const title=
    payload?.notification?.title ||
    payload?.data?.title ||
    "Colegio Waldorf Michelangelo";

  const options={
    body:
      payload?.notification?.body ||
      payload?.data?.body ||
      "Tienes una nueva notificación.",

    icon:"./logo.png",
    badge:"./logo.png",

    tag:
      payload?.data?.tag ||
      "michelangelo-fcm",

    data:
      payload?.data || {}
  };

  self.registration.showNotification(
    title,
    options
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
      .then(keys=>
        Promise.all(
          keys
            .filter(key=>key!==CACHE)
            .map(key=>caches.delete(key))
        )
      )
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET"){
    return;
  }

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
          .then(cache=>
            cache.put(
              event.request,
              copy
            )
          );

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

self.addEventListener("notificationclick",event=>{
  event.notification.close();

  const evaluationId=
    event.notification?.data?.evaluationId ||
    "";

  const targetUrl=
    evaluationId
      ? `./index.html?evaluation=${encodeURIComponent(evaluationId)}`
      : "./index.html";

  event.waitUntil(
    clients.matchAll({
      type:"window",
      includeUncontrolled:true
    })
    .then(async windows=>{
      for(const client of windows){
        if("navigate" in client){
          try{
            await client.navigate(targetUrl);
          }catch{}
        }

        if("focus" in client){
          return client.focus();
        }
      }

      if(clients.openWindow){
        return clients.openWindow(targetUrl);
      }
    })
  );
});