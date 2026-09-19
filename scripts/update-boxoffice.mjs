#!/usr/bin/env node
/**
 * Aggiorna data/boxoffice.json leggendo un feed JSON esterno.
 *
 * Il feed va indicato nella variabile d'ambiente BOXOFFICE_FEED_URL e deve
 * restituire la stessa struttura del file (vedi data/boxoffice.json).
 * Senza variabile lo script esce senza fare nulla: nessuno scraping di siti
 * terzi, che sarebbe un problema di licenza oltre che di stabilita'.
 */
import { readFile, writeFile } from 'node:fs/promises';

const DEST = new URL('../data/boxoffice.json', import.meta.url);
const url = process.env.BOXOFFICE_FEED_URL;

if (!url) {
  console.log('BOXOFFICE_FEED_URL non impostata: nessun aggiornamento.');
  process.exit(0);
}

const res = await fetch(url, { headers: { Accept: 'application/json' } });
if (!res.ok) {
  console.error(`Il feed ha risposto ${res.status}`);
  process.exit(1);
}
const feed = await res.json();

if (!Array.isArray(feed.classifica) || !feed.classifica.length) {
  console.error('Il feed non contiene una classifica utilizzabile.');
  process.exit(1);
}

const classifica = feed.classifica.slice(0, 10).map((r, i) => ({
  posizione: Number(r.posizione) || i + 1,
  titolo: String(r.titolo || '').trim(),
  tmdb_id: Number(r.tmdb_id) || null,
  incasso: Number(r.incasso) || 0,
  incasso_totale: Number(r.incasso_totale) || 0,
  schermi: Number(r.schermi) || 0
})).filter(r => r.titolo);

if (!classifica.length) {
  console.error('Nessuna riga valida dopo la normalizzazione.');
  process.exit(1);
}

const precedente = JSON.parse(await readFile(DEST, 'utf8'));
const aggiornato = {
  ...precedente,
  fonte: String(feed.fonte || precedente.fonte || '').trim(),
  settimana: String(feed.settimana || '').trim(),
  aggiornato: String(feed.aggiornato || new Date().toISOString().slice(0, 10)),
  valuta: 'EUR',
  classifica
};

await writeFile(DEST, JSON.stringify(aggiornato, null, 2) + '\n');
console.log(`Scritte ${classifica.length} righe da "${aggiornato.fonte}".`);
