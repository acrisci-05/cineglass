/* =====================================================================
   CineGlass · service worker minimo
   ---------------------------------------------------------------------
   Serve a due cose sole:
   1. rendere l'app installabile (Chrome chiede un service worker con un
      gestore di fetch prima di emettere beforeinstallprompt);
   2. far aprire CineGlass anche senza rete, col biglietto gia' salvato.

   Quello che NON fa, di proposito:
   - non tocca le chiamate a TMDB. Gli incassi, le locandine e le date
     devono essere freschi: una cache silenziosa mostrerebbe la
     programmazione della settimana scorsa senza dirlo a nessuno.
   - non mette in cache niente che non sia di questa origine.
   ===================================================================== */
/* Cambiare questo nome butta via la cache precedente all'attivazione:
   si alza a ogni modifica del guscio o di questo file. */
const VERSIONE = 'cineglass-v2';

/* Il guscio: la pagina e le icone. I percorsi sono relativi, cosi' il
   service worker funziona sia su un dominio dedicato sia sotto la
   sottocartella di GitHub Pages. */
const GUSCIO = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSIONE)
      /* addAll fallisce tutto se un solo file manca: qui si aggiunge
         uno per uno e si va avanti lo stesso. */
      .then(c => Promise.all(GUSCIO.map(v => c.add(v).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(chiavi => Promise.all(chiavi.filter(k => k !== VERSIONE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   /* TMDB e YouTube passano intatti */

  /* Rete prima, cache dopo: online si vede sempre l'ultima versione,
     offline si apre comunque quello che c'era. */
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok && res.type === 'basic'){
          const copia = res.clone();
          caches.open(VERSIONE).then(c => c.put(req, copia)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(c => {
        if (c) return c;
        /* Il ripiego sulla pagina vale SOLO per una navigazione. Per un
           file di dati che non c'e' bisogna restituire un errore vero:
           rispondere index.html a una richiesta di data/sale.json
           significa consegnare dell'HTML a chi si aspetta JSON, e
           trasformare un 404 onesto in un errore di analisi. */
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      }))
  );
});
