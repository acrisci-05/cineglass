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
- **Due viste** — carosello 3D o lista tabellare (con locandina, uscita IT, genere, voto e
  trailer diretto), scelta ricordata in `localStorage`.
- **Nelle sale ora in Italia** — classifica dei film in programmazione, con incassi reali in
  euro se configurati (vedi sotto).
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
| Nelle sale ora | `/movie/now_playing?region=IT` | Programmazione italiana corrente, ordinata per popolarità TMDB |

## Box office italiano

La sezione **Nelle sale ora in Italia** funziona in due modi:

1. **Senza configurazione** usa `/movie/now_playing?region=IT` ordinato per popolarità TMDB.
   Attenzione: la popolarità TMDB **non è un incasso** — misura visite e interazioni sulla
   scheda del film. Gli importi mostrati in quel caso sono incassi *mondiali complessivi in
   dollari* presi da `revenue`, non italiani. L'app lo dichiara esplicitamente sotto la classifica.
2. **Con incassi reali in euro**, se il repository contiene `data/boxoffice.json` con una
   classifica compilata. L'app lo carica per primo e, quando c'è, mostra gli importi in euro
   con la fonte e la settimana di riferimento.

Formato di `data/boxoffice.json`:

```json
{
  "fonte": "Cinetel",
  "settimana": "12-14 settembre 2026",
  "aggiornato": "2026-09-15",
  "valuta": "EUR",
  "classifica": [
    { "posizione": 1, "titolo": "…", "tmdb_id": 12345, "incasso": 1284500, "incasso_totale": 4120000, "schermi": 431 }
  ]
}
```

Le righe vengono abbinate ai film di TMDB tramite `tmdb_id` (o, in mancanza, per titolo
normalizzato); un film assente da TMDB viene comunque mostrato con una locandina generata.

`scripts/update-boxoffice.mjs` + `.github/workflows/boxoffice.yml` aggiornano il file ogni
lunedì leggendo il feed JSON indicato nella variabile di repository `BOXOFFICE_FEED_URL`.
Senza quella variabile lo script non fa nulla: **non include uno scraper di Cinetel o
MYmovies**, perché quei dati sono licenziati e lo scraping violerebbe i loro termini d'uso
oltre a rompersi al primo restyling. Il feed va quindi alimentato da una fonte su cui si
hanno i diritti, o compilato a mano.

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

## Gamification e gestione del tempo

**Popcorn Hype Drop** sostituisce il cuore "Non perdertelo": un secchiello in vetro disegnato su
`<canvas>` con fisica 2D scritta a mano (gravità, rimbalzo sulle pareti trapezoidali, collisioni
fra chicchi). Ogni tocco lancia tre chicchi, alza il contatore hype e — al primo — salva il film
nella watchlist locale. Il loop `requestAnimationFrame` si spegne da solo quando i chicchi si
fermano, quindi a riposo non consuma CPU.

**Finestra temporale** — il carosello mostra solo le uscite italiane dei prossimi 90 giorni
(`release_date.lte`), con badge 🟢 *Data ufficiale IT*. Tutto ciò che sta oltre finisce nella tab
**📡 Hype Radar**, ordinata per popolarità e marcata ⚪ *Previsto per il [anno]*.

**Ricerca divisa** — debounce di 300 ms, apertura con `Ctrl/Cmd+K`, risultati in una tendina di
vetro separati in 🎟️ *In sala* (già uscito) e ⏳ *In arrivo*, con le ultime 3 ricerche in
`localStorage`.

**Nove capsule informative** — cinema italiano (tricolore), festival, IMAX/ISENSE/Dolby Atmos,
scena post-credit, tratto da una storia vera o da un libro (tutte dalle keyword TMDB),
classificazione italiana (`T`, `6+`, `12+`, `14+`, `18+`) dal visto censura in `/release_dates`,
più filtri rapidi per durata e un **CineCalendario** che dispone le uscite del mese per settimana.

## Funzioni avanzate

**Trailer, gerarchia stretta** — 1) Trailer ufficiale italiano, 2) teaser o clip italiani,
3) trailer internazionale. L'`<iframe>` usa sempre `youtube-nocookie.com`; se TMDB non espone
alcun video si mostra una card in vetro con il link "Guarda Trailer su YouTube ↗" che apre la
ricerca in una nuova scheda (nessun `listType=search` incorporato).
Il **mini player** rimpicciolisce la finestra del trailer in basso a destra senza spostare
l'`<iframe>` nel DOM: la riproduzione non si interrompe e il sito resta navigabile.

**Cast e filmografia** — `/movie/{id}/credits` per regista e primi 8 interpreti, in pillole di
vetro scorribili; il click apre `/person/{id}/movie_credits` con i 5 film più popolari, e
sceglierne uno lo carica direttamente nel carosello.

**Biglietto di sala** — riepilogo a forma di biglietto con bordo perforato e **codice QR
generato dall'app** (codificatore QR scritto da zero: modalità byte, correzione L, versioni 1‑5,
mascheratura scelta per penalità). Nessuna libreria esterna; la leggibilità è verificata nei
test decodificando l'output con `jsQR`.

**Esportazioni** — un unico pulsante **📅 Salva data** apre un menu traslucido con Google
Calendar e il download `.ics` (Apple Calendar e Outlook) con promemoria a un giorno; c'è anche
l'invito precompilato su WhatsApp e **invito 9:16 disegnato su Canvas** (locandina, data, "Andiamo al
cinema?") condiviso con `navigator.share` o scaricato come PNG.

**Effetti** — colore dominante estratto dalla locandina che ridefinisce l'accento dell'interfaccia,
inclinazione 3D con riflesso specchiato sulla card attiva, pellicola 35 mm scorribile al posto dei
puntini, grana e pulviscolo, fascio del proiettore sul player, e **suoni "vetro" sintetizzati con
la Web Audio API** (nessun file audio, disattivabili dall'header).

**PWA** — manifest generato a runtime con icone disegnate su canvas e service worker (`sw.js`)
che mette in cache il guscio dell'app lasciando sempre freschi i dati TMDB.

## Accessibilità e performance

Un solo file, nessuna dipendenza (solo il font da Google Fonts), animazioni disattivate con
`prefers-reduced-motion`, navigazione da tastiera (← →, `/` per cercare, `ESC` per chiudere),
gesture di swipe e `navigator.vibrate` su mobile, `aria-label`/`aria-pressed` sui controlli e
layout responsive fino a 330px.

`sw.js` e `data/*.json` restano file separati perché un service worker non può vivere dentro
l'HTML e i dati locali devono poter cambiare senza ripubblicare l'app: `index.html` funziona
comunque da solo, senza di essi.

Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB.
