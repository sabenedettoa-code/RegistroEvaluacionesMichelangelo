// Michelangelo Evaluaciones
// PWA + Firebase Cloud Messaging

const CACHE = "michelangelo-evaluaciones-v12";

const ASSETS = [
  "./",
  "./index.html",
  "./logo.png",
  "./manifest.webmanifest"
];


/* =====================================================
   FIREBASE CLOUD MESSAGING
===================================================== */

importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.17.1/firebase-messaging-compat.js"
);


firebase.initializeApp({

  apiKey:
    "AIzaSyDL3ziFbr1borIZsSo1Rjnp_AYdc3bR3yk",

  authDomain:
    "registroevaluaciones.firebaseapp.com",

  projectId:
    "registroevaluaciones",

  storageBucket:
    "registroevaluaciones.firebasestorage.app",

  messagingSenderId:
    "60342850123",

  appId:
    "1:60342850123:web:fe462b6bb326b5818e73ce"

});


const messaging =
  firebase.messaging();


/* =====================================================
   NOTIFICACIONES EN SEGUNDO PLANO
===================================================== */

messaging.onBackgroundMessage(
  payload => {

    console.log(
      "[sw.js] Mensaje FCM en segundo plano:",
      payload
    );


    const title =
      payload?.notification?.title
      ||
      payload?.data?.title
      ||
      "Colegio Waldorf Michelangelo";


    const options = {

      body:
        payload?.notification?.body
        ||
        payload?.data?.body
        ||
        "Tienes una nueva notificación.",

      icon:
        "./logo.png",

      badge:
        "./logo.png",

      tag:
        payload?.data?.tag
        ||
        "michelangelo-fcm",

      data:
        payload?.data
        ||
        {}

    };


    self.registration
      .showNotification(
        title,
        options
      );

  }
);


/* =====================================================
   INSTALACIÓN PWA
===================================================== */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches
        .open(CACHE)

        .then(
          cache =>
            cache.addAll(
              ASSETS
            )
        )

        .then(
          () =>
            self.skipWaiting()
        )

    );

  }
);


/* =====================================================
   ACTIVACIÓN
===================================================== */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches
        .keys()

        .then(
          keys =>
            Promise.all(

              keys

                .filter(
                  key =>
                    key
                    !==
                    CACHE
                )

                .map(
                  key =>
                    caches.delete(
                      key
                    )
                )

            )
        )

        .then(
          () =>
            self.clients.claim()
        )

    );

  }
);


/* =====================================================
   CACHÉ / OFFLINE
===================================================== */

self.addEventListener(
  "fetch",
  event => {

    if (
      event.request.method
      !==
      "GET"
    ) {

      return;

    }


    const url =
      new URL(
        event.request.url
      );


    /*
      No interferir con las
      conexiones de Firebase.
    */

    if (
      url.hostname.includes(
        "googleapis.com"
      )
      ||
      url.hostname.includes(
        "firebaseio.com"
      )
      ||
      url.hostname.includes(
        "gstatic.com"
      )
    ) {

      return;

    }


    event.respondWith(

      fetch(
        event.request
      )

        .then(
          response => {

            const copy =
              response.clone();


            caches
              .open(CACHE)

              .then(
                cache =>
                  cache.put(
                    event.request,
                    copy
                  )
              );


            return response;

          }
        )

        .catch(
          () =>

            caches
              .match(
                event.request
              )

              .then(
                cached =>
                  cached
                  ||
                  caches.match(
                    "./index.html"
                  )
              )

        )

    );

  }
);


/* =====================================================
   CLIC EN NOTIFICACIÓN
===================================================== */

self.addEventListener(
  "notificationclick",
  event => {

    event.notification
      .close();


    event.waitUntil(

      clients
        .matchAll({

          type:
            "window",

          includeUncontrolled:
            true

        })

        .then(
          windows => {

            for (
              const client
              of
              windows
            ) {

              if (
                "focus"
                in
                client
              ) {

                return client
                  .focus();

              }

            }


            if (
              clients.openWindow
            ) {

              return clients
                .openWindow(
                  "./index.html"
                );

            }

          }
        )

    );

  }
);