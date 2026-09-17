# CineGlass

Web app single-page (un solo file `index.html`, zero build, zero server) con interfaccia
**Liquid Glass** per scoprire i film prossimamente al cinema in Italia tramite le API di TMDB.

## Avvio rapido

1. Ottieni una API key gratuita (v3 auth) su [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
2. Apri `index.html` e sostituisci il valore della costante in cima allo `<script>`:

   ```js
   const API_KEY = 'INSERISCI_QUI_LA_TUA_KEY';
   ```

3. Apri il file nel browser (o servilo con un qualsiasi static server, es. `npx http-server`).

Senza key l'app parte comunque in **modalità demo** con dati di esempio e permette di
incollare la key direttamente nell'interfaccia: viene salvata solo nel `localStorage` del browser.

## Cosa fa

- **Dati TMDB** — `/movie/upcoming` (`language=it-IT`, `region=IT`), due pagine unite,
  deduplicate, filtrate sulle uscite ancora da venire e ordinate per data.
- **Dettagli del film al centro** — `/movie/{id}?append_to_response=videos,release_dates`:
  data di uscita ufficiale italiana (tipo *theatrical* con fallback), trailer YouTube
  in italiano (fallback internazionale), budget, durata in ore e minuti, tagline e casa di produzione.
- **Cache TTL zero-server** — lista in `localStorage` per 6 ore (avvio istantaneo, refresh
  in background quando scade), dettagli per 24 ore.
- **Carosello 3D** — card centrale con bordo liquido animato, card laterali con `rotateY`,
  vetro smerigliato e wave effect durante lo scorrimento; navigazione con frecce, tastiera
  (← →, Home/End) e swipe/drag su touch e mouse.
- **Accento cromatico dinamico** — sfondo, blob fluidi e UI cambiano tonalità in base al
  genere del film attivo.
- **Countdown live**, **indicatore a riempimento liquido** del gradimento,
  **modal trailer con "Luci spente"**, **link dinamico a Google Calendar** e lista
  **"Non perdertelo"** salvata in `localStorage`.
- **Stati di errore** — skeleton screen animato, locandine generate in SVG quando l'immagine
  manca, fallback sulla cache e modalità demo se TMDB non risponde.

## Accessibilità e performance

Un solo file, nessuna dipendenza (solo il font da Google Fonts), animazioni disattivate con
`prefers-reduced-motion`, navigazione da tastiera, `aria-label`/`aria-pressed` sui controlli e
layout responsive fino a 390px.

Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB.
