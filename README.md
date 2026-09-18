# CineGlass

Web app single-page (un solo file `index.html`, zero build, zero server) con interfaccia
**Liquid Glass** per scoprire i film prossimamente al cinema in Italia tramite le API di TMDB.

## Avvio rapido

Apri `index.html` nel browser, oppure servilo con un qualsiasi static server:

```bash
npx http-server -p 8080     # poi apri http://localhost:8080
```

La API key TMDB (v3 auth) è la costante in cima allo `<script>`:

```js
const API_KEY = '...';
```

Essendo un'app interamente client-side la key è visibile a chiunque apra il sito o il sorgente:
va considerata pubblica e si rigenera quando serve da
[themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
Se la costante è vuota o non valida, l'app parte in **modalità demo** con dati di esempio e
permette di incollare una key dall'interfaccia: in quel caso resta solo nel `localStorage` del browser.

## Cosa fa

- **Dati TMDB** — `/discover/movie` con `region=IT`, `with_release_type=3|2` (distribuzione
  e anteprime) e `release_date.gte` calcolato ogni volta sulla data odierna: restituisce solo
  i film con un'uscita in sala italiana da oggi in avanti. Le liste TMDB riportano però la
  data di uscita *principale* (spesso quella estera), quindi ogni candidato viene arricchito
  con la vera data italiana da `/movie/{id}/release_dates` (richieste a gruppi di 6) e solo
  allora la lista viene riordinata e ripulita. Se `discover` restituisce meno di 4 titoli si
  ricade su `/movie/upcoming`.
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
- **Ricerca su TMDB** (`/search/movie`) dalla lente nell'header o con il tasto `/`,
  **filtri per genere** generati dai film effettivamente caricati e **badge fluorescente**
  sulle uscite entro 7 giorni ("Da oggi in sala", "Domani in sala", "In uscita questo weekend",
  "Tra N giorni").
- **Stati di errore** — skeleton screen animato, locandine generate in SVG quando l'immagine
  manca, fallback sulla cache e modalità demo se TMDB non risponde.

## Da dove arriva ogni dato

| Campo | Endpoint TMDB | Note |
|---|---|---|
| Data di uscita IT | `/movie/{id}/release_dates` → `IT`, tipi 3 (distribuzione) e 2 (limitata) | Si sceglie la **prossima** proiezione futura: per le riedizioni TMDB aggiunge la nuova data alla scheda originale invece di crearne una nuova |
| Trama | `/movie/{id}?language=it-IT` → `overview` | Se la traduzione italiana manca si usa quella inglese, dichiarandolo sotto al testo |
| Gradimento | `/movie/{id}` → `vote_average` × 10 | Media dei voti degli **utenti TMDB**, non della critica e non del botteghino. Sotto i 10 voti mostra `N/D`: su un film non ancora uscito una percentuale basata su 3 voti non significa nulla |
| Durata, Budget, Incassi | `/movie/{id}` → `runtime`, `budget`, `revenue` | Dati inseriti dalla community: il budget è quasi sempre 0 per le produzioni europee, e in quel caso il riquadro viene sostituito da Paese o Lingua |
| Produzione, Paese, Lingua | `production_companies`, `production_countries`, `original_language` | Paesi e lingue tradotti in italiano con `Intl.DisplayNames` |
| Trailer | `/movie/{id}?append_to_response=videos&include_video_language=it,en,null` | Preferito l'italiano; l'etichetta sul pulsante dichiara lingua e qualità |

**Serve un'API italiana alternativa?** Non esiste un equivalente pubblico e gratuito: MYmovies
e ComingSoon non espongono API, i dati Cinetel sono a pagamento. TMDB resta la fonte migliore
perché mantiene le date di uscita **per singolo paese**: il punto non è cambiare fonte, è
leggerla per bene (`region=IT` + `release_dates`, come fa questa app).

## Capire cosa si sta guardando

In fondo alla pagina una riga di stato dichiara sempre la sorgente dei film mostrati:
`Fonte: TMDB /discover (uscite IT) + date IT verificate · 24 film · uscite dal 2026-09-18 · aggiornato 14:02`.
Se diventa ambrata (`Dati di esempio — i titoli NON sono reali`) significa che TMDB non è
raggiungibile: in quel caso l'avviso in alto non è chiudibile e ogni locandina porta il badge
"Esempio", così i dati finti non possono essere scambiati per veri.

Aggiungendo `?debug=1` all'indirizzo compare il dettaglio tecnico di ogni chiamata fatta a
TMDB (URL con la chiave mascherata, esito HTTP o errore di rete, durata).

## Nota sulle date

Il filtro sulle uscite, il countdown e i badge usano l'orologio del dispositivo: TMDB non
espone il proprio header `Date` alle richieste cross-origin, quindi se la data del computer
è sbagliata anche le uscite mostrate lo saranno.

## Accessibilità e performance

Un solo file, nessuna dipendenza (solo il font da Google Fonts), animazioni disattivate con
`prefers-reduced-motion`, navigazione da tastiera, `aria-label`/`aria-pressed` sui controlli e
layout responsive fino a 390px.

Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB.
