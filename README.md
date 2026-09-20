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
  in background quando scade), dettagli per 24 ore. All'avvio le voci troppo vecchie vengono
  buttate via, senza toccare watchlist e preferenze, così la memoria non si satura e non si
  rischia di vedere dati obsoleti. Tutto viene rispecchiato su **IndexedDB**:
  se il browser sfratta `localStorage` (succede su iOS dopo qualche settimana) l'app si
  ripesca la copia buona da lì e continua a funzionare anche senza rete.
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
- **Dove si vedrà** — `/movie/{id}/watch/providers` per la regione `IT`: se il film è (o sarà)
  su Netflix, Prime Video, Disney+ o Apple TV+ compaiono i badge ufficiali con il logo,
  altrimenti la scheda dichiara **Esclusiva Cinema 🎬**.
- **📊 Box Office & Classifiche** — quarta voce della navigazione, apre una vista a tutta pagina
  con tre classifiche: **In sala ora** (incassi mondiali dei film in programmazione in Italia,
  con la pillola *In corso d'incasso* per chi non ha ancora un dato consolidato), **Tutti i tempi**
  (i 30 maggiori incassi della storia, con medaglie 🥇🥈🥉) e **Per anno** (chip `2026 · 2025 ·
  2024 · 2023` su `/discover` ordinato per `revenue`). Ogni riga porta il link 🌐 alla fonte
  ufficiale per verificare la cifra; i risultati restano in cache locale per 24 ore.
- **Ricerca su TMDB** (`/search/movie`) dalla lente nell'header o con il tasto `/`,
  **filtri per genere** generati dai film effettivamente caricati e **badge fluorescente**
  sulle uscite entro 7 giorni ("Da oggi in sala", "Domani in sala", "In uscita questo weekend",
  "Tra N giorni").
- **Nessuna attesa muta** — ogni caricamento ha la sua **sagoma in vetro con shimmer**, delle
  stesse misure del contenuto che sostituirà: carosello, scheda, lista, CineTimeline, classifica
  degli incassi, cast e risultati della ricerca. Niente salti di layout quando arrivano i dati.
- **Stati di errore** — locandine generate in SVG quando l'immagine manca, fallback sulla cache
  e modalità demo se TMDB non risponde. Se il browser perde la linea compare un badge discreto
  sotto la navbar (*Modalità offline — consultazione dalla memoria locale*): watchlist, film già
  scaricati e biglietti restano consultabili, e al ritorno online la lista si aggiorna da sola.

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
| Piattaforme streaming | `/movie/{id}/watch/providers` → `results.IT` | Abbonamento, gratis, noleggio e acquisto; cache locale di 24 ore. Senza risultati si mostra "Esclusiva Cinema" |
| Voto IMDb e Rotten Tomatoes | **nessuno: non esistono su TMDB** | Le due pillole accanto al cerchio TMDB portano alla scheda ufficiale (`imdb_id` quando c'è) e mostrano una **stima ricavata dal voto TMDB**, sempre preceduta da `~` e spiegata nel tooltip. Nessun punteggio inventato viene presentato come ufficiale |
| Colonna sonora | iTunes Search API (`itunes.apple.com/search`) | Anteprima di 30 secondi del brano più pertinente, servita da Apple e dichiarata sotto al titolo |

## Box office e classifiche

La sezione si apre dalla voce **📊 Box Office** della navigazione, ed è filtrata su **due
livelli**: prima il territorio, poi il periodo.

### Livello 1 — il territorio, e che cosa cambia davvero

`🇮🇹 Italia` · `🇺🇸 USA` · `🌐 Mondiale`

Qui serve essere precisi, perché l'API non dà quello che sembrerebbe ovvio. **TMDB espone un solo
dato d'incasso per film: `revenue`, che è l'incasso mondiale.** Non esiste un incasso domestico
statunitense né uno italiano nell'API. Quindi ogni classifica prende i dati da dove esistono
davvero:

| Classifica | Da dove vengono i numeri |
|---|---|
| **Tutti i tempi** | Elenchi curati nel codice, uno per territorio: mondiale, italiano in euro, domestico USA in dollari. Qui il territorio cambia lista **e** cifre |
| **In sala ora** | Lista da TMDB con `region`; cifre dal file di mercato se c'è, altrimenti l'incasso mondiale dichiarato come tale |
| **Per anno** | `/discover` con `region`: cambia la lista (uscite di quel paese), la cifra resta mondiale |

Le bandiere nei pulsanti sono **SVG disegnati nel file**, non emoji: Windows non ha un font per
le bandiere e le renderizza come le due lettere del codice paese, `IT` e `US`.

Dove la cifra non può essere locale, **l'etichetta della riga lo dichiara**: si legge
`12,5 M€ · Incasso Italia` quando il dato è di mercato, `$410 M · Incasso mondiale` quando viene
da TMDB, e non c'è modo di confonderli.

Così una riga può leggersi `12,5 M€ · Incasso weekend · Italia` (dato di mercato reale) oppure
`$410 M · Incasso mondiale` (dato TMDB), e non c'è modo di confonderli. È la stessa regola del
resto dell'app: meglio un'etichetta onesta che un numero che sembra locale e non lo è.

I file di mercato sono `data/boxoffice-it.json` e `data/boxoffice-us.json`, stesso formato
descritto più avanti. Per l'Italia vale ancora anche il vecchio `data/boxoffice.json`, così i
repository che ce l'hanno già continuano a funzionare.

### Livello 2 — il periodo

Sotto al territorio restano le tre classifiche.
Tutte mostrano in fondo la stessa riga fissa — *Dati d'incasso globali da TMDB / Box Office Mojo.
Cifre aggiornate periodicamente.* — e salvano il risultato in `localStorage`
(`cineglass:classifiche:v1`, TTL 24 ore) per non ripetere le chiamate e restare leggibili offline.

Gli importi in dollari passano da `formatCurrency(amount)`, quelli in euro da `formatEuro(amount)`:

| Valore | Resa |
|---|---|
| `>= 1.000.000.000` | `$2,92 Mld` (due decimali) |
| `>= 10.000.000` | `$912 M` |
| `>= 1.000.000` | `$1,5 M` (un decimale, così 1,5 milioni non diventa "2 M") |
| `<= 0` o assente | `Dato non disponibile` |

`formatEuro` segue le stesse soglie ma tiene il decimale fino a **cento** milioni
(`12,5 M€`, non `13 M€`): gli incassi di un mercato singolo stanno nell'ordine dei milioni, e lì
il decimale è metà dell'informazione.

### 🎟️ In sala ora

`/movie/now_playing` con la `region` del territorio scelto, arricchito con `revenue` dalla scheda
di ogni film e ordinato per incasso decrescente. **Qui i film con `revenue = 0` non vengono nascosti**: un titolo uscito da
pochi giorni ha davvero zero su TMDB, e al posto di una cifra finta compare la pillola in vetro
**"In corso d'incasso"**. Funziona anche con `data/boxoffice.json` (vedi sotto).

### 🏆 Tutti i tempi

Tre elenchi curati a mano, uno per territorio, perché TMDB ordina per `revenue` solo la prima
pagina e su molti titoli storici il campo è vuoto o sbagliato: **la top all-time non si può
costruire dall'API**.

| Territorio | Fonte | Valuta | Voci |
|---|---|---|---|
| 🌐 Mondiale | Box Office Mojo / Wikipedia | USD | 30 |
| 🇮🇹 Italia | Cinetel / ANICA | EUR | 18 |
| 🇺🇸 USA | Box Office Mojo (*domestic*) | USD | 20 |

**Sull'attendibilità delle cifre.** Quelle statunitensi e mondiali sono ampiamente pubblicate e
stabili. Quelle italiane lo sono meno: Cinetel rileva il botteghino dal 1995, quindi i film
precedenti (*La vita è bella*, *Titanic*) sono ricostruiti da importi in lire, e il primo posto
è storicamente conteso fra *Avatar* e *Quo vado?*, che stanno a poche centinaia di migliaia di
euro di distanza e cambiano ordine a seconda che si contino o no le riedizioni. La nota sotto la
classifica lo scrive, e ogni riga ha il link 🌐 per controllare alla fonte.

Gli elenchi non portano l'identificativo TMDB di ogni film — indovinarlo sarebbe peggio che non
averlo — quindi i film senza `tmdb_id` vengono **cercati per titolo e anno**, accettando solo un
risultato con l'anno giusto a meno di uno. E quando il film è stato trovato cercando, **il titolo
curato non viene sostituito** da quello di TMDB: una ricerca può sbagliare film, e una cifra
giusta sotto un titolo sbagliato è peggio di nessuna locandina.

Ogni elenco si può sovrascrivere con un file del repository: `data/alltime.json` per il mondiale,
`data/alltime-it.json` e `data/alltime-us.json` per i due mercati.

TMDB ordina per `revenue` solo la prima pagina e su molti titoli storici il campo è vuoto o
sbagliato: **la top all-time non si può costruire dall'API**. La tab parte quindi da un elenco
curato a mano nel codice (`ALLTIME`, 30 film con titolo, anno, incasso e `tmdb_id`), verificato
su Box Office Mojo / Wikipedia, e lo arricchisce con locandine, titolo italiano e dati di scheda
presi da TMDB. Sono incassi **mondiali lordi**, riedizioni comprese e **non adeguati
all'inflazione**: un film del 1997 e uno del 2025 non si confrontano davvero alla pari, e la nota
sotto la classifica lo dice.

La nota riporta anche la **data dell'ultimo controllo** (`ALLTIME_AGGIORNATO`) e ogni riga ha il
pulsante 🌐 che apre la ricerca su Box Office Mojo: la cifra si verifica alla fonte in un tocco,
senza doversi fidare dell'elenco integrato. La stessa coppia di link (🌐 Box Office Mojo,
📖 Scheda Wikipedia) compare anche nella scheda di dettaglio di ogni film.

Per aggiornare l'elenco senza toccare il codice basta un `data/alltime.json`:

```json
{
  "fonte": "Box Office Mojo",
  "aggiornato": "2026-09-20",
  "film": [
    { "titolo": "Avatar", "anno": 2009, "incasso": 2923706026, "tmdb_id": 19995 }
  ]
}
```

### 📅 Per anno

`/discover/movie?primary_release_year={ANNO}&sort_by=revenue.desc&language=it-IT`, con i chip
dell'anno in corso e dei tre precedenti. Scegliendo Italia o USA si aggiungono
`region` e `with_release_type=3|2`, quindi la lista diventa quella delle **uscite in sala di quel
paese** in quell'anno — non la stessa lista con un'etichetta diversa. Qui il filtro **esclude ogni risultato con
`revenue <= 0`**: in una classifica di incassi una riga a zero non è un'informazione, è rumore.
Se TMDB non dichiara ancora incassi per quell'anno la lista lo scrive invece di restare vuota.

### Incassi italiani in euro

La classifica **In sala ora** funziona in due modi:

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

Formato di `data/alltime.json`: vedi sopra, nella tab *Tutti i tempi*.

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

## Struttura e navigazione

**Navbar flottante** (`position: fixed`, `z-index: 1000`) ridotta all'essenziale, su una riga
sola che non va mai a capo (`flex-wrap: nowrap`): logo a sinistra, e a destra soltanto
`[ 🔍 Cerca ]`, `[ 🍿 Watchlist (N) ]` e `[ ⚙️ ]`. Tutto il resto vive nel **menu impostazioni**,
un foglio in vetro che sale dal basso con tema, suono e vibrazione, luci in sala, film casuale,
ricarica dati, profilo e Instagram — ogni voce con icona, titolo e stato corrente.

**Segmented control** `[ 🎟️ Ora in sala | ⏳ In arrivo | 🗓️ Timeline ]` subito sotto la navbar,
con indicatore liquido "metaball" che si allunga durante il cambio.

**Tre temi** — chiaro, scuro e alto contrasto, scelti dal menu e ricordati in `localStorage`.
Il chiaro non è un'inversione automatica: ridefinisce i token (`--bg`, `--txt`, `--glass`,
`--stroke`…) perché il vetro resti vetro anche su fondo chiaro, con il tasto principale tenuto
scuro per non perdere contrasto sul testo bianco.

Due sezioni, senza ambiguità temporale:

- **⏳ In arrivo al cinema** — uscite italiane future in ordine cronologico crescente
  (`/discover` con `release_date.gte`, più gli annunci lontani per popolarità).
- **🎟️ Ora in sala** — `/movie/now_playing?region=IT`, ordinate per popolarità e voto.

**CineTimeline** — timeline verticale in vetro con nodi per anno e pillole di filtro rapido
`[ Tutti ] [ 2026 ] [ 2027 ] [ 2028+ ]`. Gli annunci lontani vengono raccolti scorrendo
**più pagine** di `/discover?sort_by=popularity.desc` (fino a 4), così saghe e kolossal
annunciati per il 2028 e oltre compaiono davvero. Carosello e lista restano disponibili da un
micro-selettore nella barra dei filtri.

**Date Change Tracker** — l'app ricorda in `localStorage` l'ultima data vista per ogni film e
marca ogni scheda con 🟢 *Confermata IT*, 🔄 *Data spostata dal …* (arancione al neon) o
⚪ *Annunciato [anno]* quando è attendibile solo l'anno. Ovunque la data compare per esteso
(**DAL 24 SETTEMBRE 2026**) affiancata da 🟢 *IN SALA ORA* o ⏳ *TRA X GIORNI / SETTIMANE / MESI*.

**Watchlist in un drawer solo** — `🍿 Watchlist (N)` apre un pannello laterale traslucido con i
film ordinati per imminenza di uscita, il livello di hype accumulato, `🔗 Condividi lista`
(`navigator.share`, altrimenti appunti) e `🗑️ Svuota`.

## Gamification e micro-interazioni

### La micro-interazione del popcorn

Salvare un film è il gesto più frequente dell'app, quindi è quello che doveva costare meno
attesa. Il ciclo intero sta in **430ms**.

Il pulsante sulla locandina attiva ha tre stati dichiarati da una sola classe (`.salvato`):

| Stato | Icona | Come ci si arriva |
|---|---|---|
| Non salvato | chicco di mais, solo contorno, colore spento | stato di partenza |
| Salvato | secchiello pieno colorato + spunta verde | primo tocco, con un **POP!** (`scale` 0.76 → 1.22 → 1) |
| Si toglie | tremolio e ritorno al chicco | secondo tocco (`translate3d` + `rotate`, 380ms) |

Al tocco l'icona **si sdoppia**: sulla scheda resta subito lo stato salvato (non sparisce
nulla), e un clone `position:fixed` parte in volo verso il secchiello 🍿 nell'header.

La traiettoria è una **Bezier quadratica** costruita da `traiettoriaPopcorn()`: gli estremi
sono i centri dei due elementi letti con `getBoundingClientRect()`, e il punto di controllo sta
sopra entrambi (`min(y0,y1) - max(80, |x1-x0| * 0.34)`), così il popcorn *salta* invece di
strisciare in diagonale. La curva viene campionata in 17 fotogrammi passati a
`element.animate()`: si toccano **solo `transform` e `opacity`**, quindi il browser manda
l'animazione sul compositor e restano 60fps anche salvando cinque film di fila. Ogni volo ha il
suo elemento, quindi i tocchi rapidi non si disturbano a vicenda.

**Il contatore aspetta l'atterraggio.** Al tocco la watchlist è già aggiornata, ma il numero
nell'header resta fermo: lo sblocca `rimbalzaSecchiello()` all'82% del volo, insieme al rimbalzo
del secchiello. È quel piccolo ritardo a far sembrare che sia il popcorn a riempire il
secchiello, invece di due animazioni scollegate.

Il rimbalzo e il `+1` stanno su un `setTimeout`, non sull'evento `finish` dell'animazione: se la
scheda è in secondo piano e i fotogrammi non arrivano, la wishlist resta comunque in pari e il
clone viene rimosso da una rete di sicurezza a 1330ms.

### Minimalismo acustico: un suono solo

CineGlass fa **un rumore e basta**: il POP del popcorn quando un film entra in wishlist.
Carosello, swipe, modali, navigazione, condivisione e taglio del CinePass sono muti. Un suono
che commenta quello che già si vede non aggiunge niente: dà solo fastidio al quinto tocco. Il
POP resta perché segna l'unico momento in cui succede davvero qualcosa.

Il suono è **sintetizzato con la Web Audio API**, nessun file audio. Un chicco vero fa due cose
in pochi millisecondi — il pericarpo si spacca, poi l'amido si espande di colpo — e il codice
rifa' le due cose in fila:

| Strato | Cosa è | Quando |
|---|---|---|
| Schiocco | rumore bianco passa-alto a 1,5kHz + picco di +7dB sui 3,2kHz | 0 → 12ms |
| Corpo | triangolare, caduta 620Hz → 115Hz | 3 → 52ms |
| Coda | sinusoide 180Hz → 70Hz, livello basso | 5 → 48ms |

Tre dettagli che fanno la differenza fra un pop e un "boing":

- **Il corpo entra 3ms dopo lo schiocco.** Prima il chicco si rompe, poi si gonfia. Partendo
  insieme, le basse coprono la croccantezza e il suono diventa sordo.
- **Gli attacchi sono rampati in poco più di un millisecondo**, non a gradino. Saltare da zero al
  volume pieno aggiunge un click digitale che si sente più del pop stesso.
- **Rumore passa-alto, non passa-banda stretto.** La croccantezza sta nell'essere largo di banda:
  una banda sola fischia. E il corpo è **triangolare**, perché la sinusoide pura fa il classico
  "boing" da cartone animato.

Ogni pop ha un **±8% di scarto casuale** su intonazione e centro del filtro: due chicchi non
scoppiano mai identici, e senza quello salvare cinque film di fila suona come una raffica.

Misurato rendendo la catena in un `OfflineAudioContext`: picco 0,71 (nessun clipping), primo
campione a zero (nessun gradino), picco raggiunto a 1,2ms, **43ms di durata udibile** e silenzio
pieno dopo 60ms. Nei primi 12ms l'energia sta nelle alte (−19,3dB contro −24,5dB), da 14ms in
poi si sposta nelle basse (−33,9dB contro −64,2dB): schiocco e corpo sono davvero due eventi
distinti, non un tono unico.

L'`AudioContext` è **uno solo per tutta la pagina**, creato pigramente e sbloccato al primo tocco
(`resume()` è asincrono, quindi sbloccarlo prima serve a far partire il POP davvero a `t = 0`
anche al primo salvataggio). Aprirne uno nuovo a ogni suono è la trappola classica: i browser ne
consentono una manciata per scheda e si esauriscono dopo pochi tocchi.

Il tasto **Suono e vibrazione** nel menu impostazioni spegne il POP e le vibrazioni insieme; la
scelta resta in `localStorage`.

### Personalizzare i tempi

Tutto quello che regola la durata sta in tre punti:

- `VOLO_MS` (JavaScript, `430`) — durata del volo; il rimbalzo scatta sempre all'82% di questo
  valore, quindi si sposta da solo.
- `CP_TAGLIO_MS` (JavaScript, `760`) — corsa della forbice sul CinePass; il tagliando si svela al
  72%. La keyframe `cgTaglio` legge `var(--cp-ms)`, quindi cambiando la variabile CSS cambia
  l'animazione e cambiando la costante cambia il momento in cui compare il QR: vanno tenute in pari.
- Le keyframe `cgPop`, `cgScuoti`, `cgRimbalzo` e `cgTick` nel `<style>` — durate scritte nella
  regola che le usa (`.pop-btn.pop`, `.pop-btn.scuoti`, `.pill-btn.rimbalza`, `.badge.tick`).
- `sfx.pop()` — i tempi del suono sono gli offset `t + ...` dei tre strati. Per un pop più secco
  si accorciano le code (`0.052` del corpo e `0.048` della coda); per uno più croccante si alza
  il guadagno del picco a 3,2kHz.

Con `prefers-reduced-motion: reduce` il volo, il rimbalzo e la corsa della forbice non partono
affatto: il film si salva, il contatore va avanti e il QR compare subito.

### Collegare un backend

L'interazione non sa nulla di dove finiscano i dati: `tapPopcorn()` scrive in `state.favs` e
chiama `store.set(STORE.favs, ...)`. Per sincronizzare con un'API basta intercettare quel punto
(un `POST /wishlist` con `movie.id`) e lasciare intatto il resto: l'animazione parte prima della
richiesta, quindi l'interfaccia resta immediata, e in caso di errore si rimette lo stato
chiamando `updateFavUI()` dopo aver rimesso a posto `state.favs`. Il QR del CinePass codifica
`deepLink(movie)`, cioè `origin + pathname + '?movie=' + id`: cambiando quella funzione cambia
l'URL condiviso ovunque, QR e immagine scaricabile compresi.

### Il secchiello dell'hype

**Popcorn Hype Drop** è la cosa diversa dal salvataggio: misura quanto un film è atteso. Un
secchiello in vetro disegnato su
`<canvas>` con fisica 2D scritta a mano (gravità, rimbalzo sulle pareti trapezoidali, collisioni
fra chicchi). Ogni tocco lancia tre chicchi, alza il contatore hype e — al primo — salva il film
nella watchlist locale. Il loop `requestAnimationFrame` si spegne da solo quando i chicchi si
fermano, quindi a riposo non consuma CPU.

**Finestra temporale** — il carosello mostra le uscite italiane dei prossimi 90 giorni
(`release_date.lte`); tutto ciò che sta oltre resta visibile nella CineTimeline.

**Barra dei filtri** — sul desktop una riga sola: le pillole dei generi, il pulsante
`🎛️ Filtri` che apre un pannello traslucido con durata, storia vera e box office (con il
contatore dei filtri attivi e un `Azzera`), e il micro-selettore carosello/lista. Sugli schermi
grandi la locandina centrale del carosello è più generosa (fino a 330px) per riempire il campo
visivo invece di lasciare vuoti ai lati.

**Ricerca Spotlight** — la lente in vetro (o `Ctrl/Cmd + K`, o `/`) apre un overlay centrale a
`backdrop-filter: blur(30px)` che cerca mentre si digita, con miniature, data e separazione fra
🎟️ *In sala* e ⏳ *In arrivo*; debounce di 300 ms. A campo vuoto mostra lo **storico delle
ricerche** (fino a 8 termini in `localStorage`) come pillole che si rilanciano con un tocco e si
cancellano una a una con la ×, più gli ultimi film aperti.

**Sorprendimi 🎲** — il dado nella navbar (o il tasto `R`, o uno **scuotimento del telefono**
via `DeviceMotionEvent`) pesca a caso fra i film meglio votati della lista e lo porta al centro.

**Frecce del carosello** — stanno sopra alle locandine con `z-index: 140`, sopra al tetto di 120
che il ciclo di render assegna alle schede (`Z_CARD_MAX`): i due numeri sono accoppiati e vanno
tenuti in pari, perché quando le schede salivano sopra le frecce il tocco arrivava alla locandina
sotto e apriva il trailer. Il gesto è isolato con `stopPropagation()` già sul `pointerdown`, così
nemmeno il trascinamento del carosello parte per sbaglio. Niente `preventDefault()` su
`touchstart`: annullerebbe il `click` che segue e le frecce smetterebbero di funzionare — il
ritardo di 300ms è già tolto da `touch-action: manipulation`.

**Swipe sulla scheda** — su telefono si passa al film successivo o precedente trascinando in
orizzontale sulla scheda, senza tornare al carosello; i gesti verticali restano scorrimento
della pagina e quelli che partono da un controllo vengono ignorati.

**Teatro Mode** — appena parte il trailer la pagina attorno al player scende al 10% di opacità
e luminosità: resta acceso solo il film. Si riaccende chiudendo il trailer, passando al mini
player o premendo *Luci accese*.

**Popcorn della wishlist** — il chicco in alto a destra sulla locandina attiva ha tre stati:
contorno spento quando il film non è salvato, secchiello pieno con la spunta verde quando lo è,
e un tremolio quando lo si toglie. Al tocco l'icona fa **POP!** e si sdoppia: una copia resta
fissa come stato salvato sulla scheda, un clone vola lungo una **parabola** fino al secchiello
🍿 nell'header, che rimbalza e fa scattare il contatore di +1. Vedi sotto per i dettagli.

**CinePass con le forbici** — il biglietto in vetro si apre tagliandolo, e si capisce subito:
a riposo la forbice sta **ferma sul tratteggio**, centrata in verticale e pulsante piano, con
accanto la scritta *✂️ Clicca per strappare il biglietto*; al posto del tagliando c'è la guida
*Clicca sulla linea tratteggiata qui sopra per rivelare il tuo CinePass*. Al passaggio del mouse
la linea si accende in rosso cinema e la forbice apre e chiude le lame. Al clic la forbice corre
**da destra a sinistra** lungo la riga, la linea si spegne e il tagliando col QR scende con un
fade-in — il biglietto passa da 384 a 680px, quindi lo scorrimento si vede davvero. Con la
vibrazione aptica e una **pioggia di micro-schegge di vetro disegnata su `<canvas>`**, in
silenzio: l'unico suono dell'app è il POP del popcorn (vedi sotto).

Prima la forbice era `opacity: 0` a riposo: invisibile, e nessuno poteva intuire che la riga
fosse cliccabile. Il tagliando ora è compresso a `max-height: 0` finché non si taglia, così
l'area vuota è alta quanto la guida e non quanto il QR, e condivide la stessa cella di griglia
con la guida: niente doppia altezza, niente salto di layout.

**Altro** — vetro appannato anti-spoiler sulla scena post-credit (si pulisce strofinando),
locandina a schermo intero al tap, interruttore "luci in sala" e **anteprima di 30 secondi della
colonna sonora** in un widget a forma di disco (iTunes Search API, dichiarata come tale).

**Capsule informative** — cinema italiano (tricolore), festival, IMAX/ISENSE/Dolby Atmos,
scena post-credit, tratto da una storia vera o da un libro (tutte dalle keyword TMDB),
classificazione italiana (`T`, `6+`, `12+`, `14+`, `18+`) dal visto censura in `/release_dates`,
durata formattata `2h 15m`, più filtri rapidi per durata e il filtro `💰 Box Office` che porta
alla classifica degli incassi.

## Funzioni avanzate

**Trailer, gerarchia stretta** — 1) Trailer ufficiale italiano, 2) teaser o clip italiani,
3) trailer internazionale. L'`<iframe>` usa sempre `youtube-nocookie.com`; se TMDB non espone
alcun video si mostra una card in vetro con il link "Guarda Trailer su YouTube ↗" che apre la
ricerca in una nuova scheda (nessun `listType=search` incorporato).
L'iframe porta sempre `origin=<location.origin>`, `enablejsapi=1` e
`referrerpolicy="strict-origin-when-cross-origin"`: senza quei parametri YouTube risponde con
l'errore di configurazione 150/153 su alcuni domini. Sopra al player c'è `↗️ Apri su YouTube`,
in basso a destra `⛶ Tutto schermo` (`element.requestFullscreen()`).
Il **mini player** rimpicciolisce la finestra del trailer in basso a destra senza spostare
l'`<iframe>` nel DOM: la riproduzione non si interrompe e il sito resta navigabile. Si attiva
**da solo** appena si scorre per leggere trama o cast, e torna grande quando si risale in cima.

**Cast e filmografia** — `/movie/{id}/credits` per regista e primi 8 interpreti, in pillole di
vetro scorribili; il click apre `/person/{id}/movie_credits` con i 5 film più popolari, e
sceglierne uno lo carica direttamente nel carosello.

**CinePass** — il biglietto di condivisione, in fondo alla scheda. Dall'alto: badge
`🎬 CINEGLASS PASS`, mini‑locandina con titolo, genere, data, durata, visto censura e voto;
separatore perforato con la forbice; tagliando col **codice QR generato dall'app**
(codificatore QR scritto da zero: modalità byte, correzione L, versioni 1‑5, mascheratura
scelta per penalità — nessuna libreria esterna, e nei test l'output viene riletto con `jsQR`);
box del link in monospace ciano col codice del biglietto; `Copia link` e `Scarica CinePass`.

Il vetro è `rgba(18,18,24,.75)` con `backdrop-filter: blur(16px)` e bordo neon
`rgba(255,45,111,.4)`. **Gli incavi laterali sono buchi veri**, non cerchietti dipinti: due
`radial-gradient` in `mask` composti con `mask-composite: intersect`, così si vede attraverso
il biglietto quello che ci sta dietro. La loro altezza (`--cut`) viene misurata da JavaScript
sulla posizione reale della perforazione, quindi restano allineati anche quando il titolo va
a capo. Senza supporto a `mask-composite` il biglietto resta rettangolare: nessuna rottura.

`Copia link` usa `navigator.clipboard` e ripiega su una selezione nascosta fuori da HTTPS,
con conferma `✓ Copiato!` sul pulsante per due secondi. `Scarica CinePass` ridisegna il
biglietto su un canvas 900×1180 — incavi compresi, ritagliati con
`globalCompositeOperation = 'destination-out'` — e lo passa a `navigator.share` sul telefono
o lo scarica come PNG altrove.

**Condivisione** — un solo tasto **Invita amici**: su telefono usa `navigator.share` con
l'immagine 9:16 generata su canvas, su desktop apre WhatsApp; in entrambi i casi allega il
deep link `?movie=<id>`, lo stesso che finisce nel QR del promemoria.

**Esportazioni** — un unico pulsante **📅 Salva data** apre un menu traslucido con Google
Calendar e il download `.ics` (Apple Calendar e Outlook) con promemoria a un giorno; c'è anche
l'invito precompilato su WhatsApp e **invito 9:16 disegnato su Canvas** (locandina, data, "Andiamo al
cinema?") condiviso con `navigator.share` o scaricato come PNG.

**Impulso "questa settimana"** — le locandine salvate in watchlist che escono entro 7 giorni
pulsano in arancione neon, nel carosello, nella lista e nel drawer (dove portano anche
l'etichetta *questa settimana*).

**Countdown a schermo intero** — dalla scheda di un film futuro, `⏱️ Countdown schermo intero`
(o il tasto `T`) apre una schermata nera OLED con giorni, ore, minuti e secondi all'uscita, e
tiene acceso lo schermo con la Screen Wake Lock API dove è disponibile.

**Effetti Liquid Glass** — colore dominante estratto dalla locandina (media pesata su una
griglia ridotta disegnata su `<canvas>`) che ridefinisce l'accento dell'interfaccia, **l'alone
dietro la card** e **l'alone del tasto *Guarda il trailer***, bordi con refrazione prismatica
ciano/magenta, badge a bolla 3D con punto luce e bordo `rgba(255,255,255,.2)`, pillole dei
punteggi con `border-radius` asimmetrico animato (goccia organica), lampo diagonale lucido sulla
card attiva, increspatura liquida al click dei pulsanti, attrazione magnetica entro 50px dal
cursore, indicatore metaball della navbar, vetro satinato per gli stati vuoti, inclinazione 3D
con riflesso specchiato e **lente convessa cromatica** con aberrazione ciano/magenta, agganciata
su telefono all'inclinazione reale del dispositivo (`DeviceOrientationEvent`). Più pellicola
35 mm scorribile al posto dei puntini, grana e pulviscolo e fascio del proiettore sul player.

## Fluidità e risposta al tocco

Nessun ritardo di 300 ms: `touch-action: manipulation` e `-webkit-tap-highlight-color: transparent`
su ogni elemento interattivo, e un solo `transform: scale(.96)` all'`:active` come feedback —
niente blur o ombre da ricalcolare sotto il dito. Tutti i listener di `touchstart`, `touchmove` e
`wheel` sono `{ passive: true }`, così il thread principale non aspetta mai un eventuale
`preventDefault()` durante lo scorrimento.

**Su telefono (≤768px) il carosello passa a 2D**: niente `perspective` né `preserve-3d`, solo
traslazioni e ridimensionamenti con `will-change: transform`. Grana e pulviscolo spariscono, e il
contenitore del carosello usa `touch-action: pan-y`, così lo swipe orizzontale dei film non ruba
lo scorrimento verticale della pagina.

### La regola del vetro: non "quanto blur", ma "che cosa c'è sotto"

Un `backdrop-filter` costa al compositore un **ricampionamento dello sfondo** sotto l'elemento.
Su una superficie ferma lo paga una volta e tiene il risultato in cache; su una superficie che si
muove lo paga a ogni fotogramma. Il criterio non è quindi ridurre il raggio ovunque — ridurlo
aiuta poco se la superficie continua a muoversi — ma **togliere del tutto la sfocatura da ciò che
si muove**, e tenerla dove non si muove niente.

In pratica:

| Dove | Cosa fa | Perché |
|---|---|---|
| Barra fissa, CinePass, modali, fogli, Spotlight, drawer | `blur(8px)` su mobile | Sono ferme: il ricampionamento si paga una volta |
| Interno delle locandine (`.frost`, `.card-play`, `.card-quick`, il popcorn) | **nessun blur**, fondo pieno | Traslano a ogni fotogramma del carosello |
| Increspatura al tocco (`.rip`) | **nessun blur** | È un cerchio che si espande: sfondo diverso a ogni fotogramma |
| Tutto il resto su mobile (chip, pillole, scheda, righe di lista…) | **nessun blur**, fondo pieno | Scorre con la pagina |

Il velo `.frost` sulle locandine laterali era il caso peggiore: un `backdrop-filter: blur(20px)`
esteso all'**intera** locandina, la cui opacità cambia a ogni fotogramma del carosello. Adesso è
un gradiente opaco: a occhio è lo stesso velo, ma non fa ricampionare niente.

**Le stesse regole valgono nel blocco `.perf-bassa`**, e devono ripeterle: quei selettori hanno
specificità maggiore, quindi elencare lì un elemento in movimento gli rimetterebbe il
`backdrop-filter` appena tolto — che è esattamente il bug che l'audit ha trovato.

**Durante il trascinamento** (`body.trascina`) si fermano tutte le animazioni continue: i due
gradienti conici del bordo "Mercurio" e i veli del fondale. Durano fra i 26 e gli 88 secondi,
quindi mezzo secondo di pausa non si vede — e restituisce il budget di fotogramma al compositore,
che in quel momento ha già sette locandine da spostare.

**Misurato** su iPhone 13 a 390px, confrontando la versione precedente con quella attuale:

| | Prima | Dopo |
|---|---|---|
| Elementi con `backdrop-filter` attivo | 69 | 4 |
| Superficie sfocata totale | 1.716k px² | 264k px² |
| **Superficie sfocata in movimento** | **281k px²** | **0** |
| Superficie con `filter: blur()` in movimento | 1.602k px² | 550k px² |
| Costo stile+layout di un fotogramma del carosello | 5,59 ms | 5,27 ms |

L'ultima riga è l'unica misurata a cronometro (150 fotogrammi forzati in sincrono, mediana di
cinque prove, intervalli non sovrapposti): −5,6%, modesto, perché quel test misura stile e layout
mentre il risparmio vero sta nel *compositing*. Le prime quattro righe sono strutturali e
certe. Il guadagno in fotogrammi al secondo su un telefono reale non è stato misurato: in questo
ambiente di sviluppo la cadenza dei fotogrammi non è affidabile.

**Locandine a peso giusto** — quella al centro arriva in `w780` con `fetchpriority="high"`, le
laterali e le miniature in `w342` con `loading="lazy"`; quando una card diventa centrale la sua
immagine viene promossa all'alta risoluzione in background. Se TMDB non ha la locandina, al suo
posto compare un **SVG generato al volo**: sfondo sfumato in vetro, prisma 3D con rifrazione
ciano/magenta e titolo in evidenza.

**Sotto la piega** footer, classifica e blocchi della timeline usano
`content-visibility: auto` con `contain-intrinsic-size`, così il browser non calcola layout e
rendering di quel che non si vede.

**Aptica graduata** — 10 ms per i micro-tap su filtri e tab, 20 ms per l'apertura di modali e
drawer, `[30, 40, 30]` per i gesti meccanici (taglio del CinePass, svuotamento della watchlist).

**Pull-to-refresh** — trascinando verso il basso in cima alla pagina si allunga una goccia di
vetro; al rilascio oltre la soglia le uscite si ricaricano da TMDB senza perdere lo stato
dell'app. Il gesto è intercettato solo dove non c'è già qualcosa che scorre.

## Accessibilità e performance

Un solo file, nessuna libreria (l'unico asset esterno è il font da Google Fonts; a runtime si
parla solo con TMDB, con `image.tmdb.org` e — per la sola anteprima della colonna sonora — con
l'API di ricerca di iTunes), animazioni disattivate con
`prefers-reduced-motion`, `aria-label`/`aria-pressed` sui controlli e layout responsive fino a
330px. Navbar e drawer rispettano `env(safe-area-inset-*)`, così Dynamic Island, notch e barra
di sistema non coprono mai i comandi. **Ogni elemento interattivo misura almeno 44×44px** (verificato da un audit automatico su
iPhone in home, scheda, Spotlight, drawer e timeline) e la pagina non scorre mai in orizzontale.

**Scorciatoie da tastiera** — `←` `→` scorrono il carosello, `Home`/`End` saltano agli estremi,
`/` oppure `Ctrl/Cmd + K` aprono lo Spotlight, `W` apre la watchlist, `R` pesca un film a caso,
`T` il countdown a schermo intero, `L` spegne le luci nel trailer, `ESC` chiude qualsiasi overlay.

**Adattamento prestazionale** — all'avvio l'app legge `navigator.hardwareConcurrency`,
`navigator.deviceMemory` e lo stato di risparmio dati: su hardware modesto applica le stesse
regole del vetro descritte sopra, spegne grana e pulviscolo, ferma l'alone del bordo Mercurio, e salta le
**View Transitions** (su una pagina così densa di sfocature fotografare l'intera radice costa più
dell'animazione che regala: meglio un cambio istantaneo). Dove il dispositivo regge,
`document.startViewTransition()` anima l'espansione della locandina verso la vista ingrandita.

`data/*.json` restano file separati perché i dati locali devono poter cambiare senza
ripubblicare l'app: `index.html` funziona comunque da solo, senza di essi. Nessuna finestra di
sistema: anche la richiesta della città per gli orari è un foglio in vetro, e ogni conferma passa
dalle pillole *toast* traslucide ancorate in basso al centro. Nessun service
worker e nessun manifest: è un sito statico puro, pronto per GitHub Pages o Vercel.

## Una nota sull'onestà dei numeri

TMDB non espone i voti di IMDb né quelli di Rotten Tomatoes, e non esiste un'API pubblica e
gratuita che lo faccia. Le due pillole accanto al cerchio TMDB esistono lo stesso — portano alla
scheda ufficiale, che è la cosa utile — ma il numero che mostrano è una **stima ricavata dal voto
TMDB**, marcata con `~` e dichiarata nel tooltip. Stesso discorso per il 🍅 sotto le locandine:
è una stima della critica, mentre il 🍿 accanto è il voto reale del pubblico TMDB. Preferiamo una
stima dichiarata a un numero inventato che sembra ufficiale.

Questo prodotto usa le API di TMDB ma non è approvato né certificato da TMDB.
