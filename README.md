# ☀️ MeteoTracker Pro

> App web per le previsioni meteo, costruita con HTML, CSS e JavaScript vanilla.

---

## 📖 Panoramica

**MeteoTracker Pro** permette di cercare le previsioni meteo di qualsiasi città al mondo. Interroga le API gratuite di [Open-Meteo](https://open-meteo.com/) per geocoding e previsioni giornaliere/orarie, con un'interfaccia dark moderna, animazioni fluide e design responsive.

---

## 🛠️ Installazione

**Prerequisiti:** browser moderno (Chrome, Firefox, Safari, Edge) e connessione Internet. Node.js v16+ solo per i test.

```bash
git clone <url-repository>
cd MeteoTrial
open index.html        # macOS
# xdg-open index.html  # Linux
# start index.html     # Windows
```

Nessuna dipendenza da installare — tecnologie web native soltanto.

---

## 🚀 Utilizzo

1. Apri `index.html` nel browser.
2. Digita il nome di una città — i **suggerimenti** appaiono dopo 2 caratteri.
3. Seleziona un suggerimento oppure premi **Invio** / clicca **Cerca**.
4. Visualizza le previsioni a 7 giorni in formato lista verticale.
5. **Clicca su una card** per espanderla e vedere i dettagli del giorno.

### Esecuzione dei test

```bash
node test_suite.js   # suite completa (13 test)
node test.js         # test base (Milano, 7/10/14 giorni)
```

---

## ✨ Funzionalità

| Funzionalità | Descrizione |
|---|---|
| **Autocomplete** | Suggerimenti città in tempo reale dopo 2 caratteri, con debounce 250 ms |
| **Navigazione da tastiera** | Frecce ↑↓, Invio per selezionare, Esc per chiudere il dropdown |
| **Previsioni 7 giorni** | Lista con temperatura max/min, icona e descrizione condizioni |
| **Card espandibile** | Click su un giorno per aprire il pannello dettagli (un solo aperto alla volta) |
| **Dettagli giornalieri** | Precipitazioni (mm), vento max (km/h), alba, tramonto, indice UV con badge colorato |
| **Andamento orario** | Temperatura, probabilità pioggia e vento ogni 3 ore (00:00–21:00) |
| **Design dark** | Tema scuro con orbs animati, palette indigo/viola, stile flat |
| **Design responsive** | Layout adattivo per desktop, tablet e mobile |
| **Cache in memoria** | Risposte API memorizzate per 1 ora con `Map`, evita chiamate duplicate |
| **Spinner di caricamento** | Feedback visivo durante il recupero dati |
| **Messaggi d'errore** | Box rosso dedicato, senza interrompere l'esperienza |
| **Accessibilità** | `role`, `aria-expanded`, `aria-label`, navigazione da tastiera completa |
| **Codici WMO completi** | Tutti i 29 codici meteo WMO mappati con etichetta italiana e emoji |

---

## 🗂️ Card espandibile — dettaglio

Cliccando su una card giornaliera si apre un pannello con:

- **4 statistiche** in griglia: precipitazioni, vento massimo, alba, tramonto
- **Badge UV** colorato in base all'intensità (Basso / Moderato / Alto / Molto alto)
- **Tabella oraria** ogni 3 ore con temperatura, probabilità pioggia e velocità vento

Un solo pannello può essere aperto alla volta: aprirne uno chiude automaticamente il precedente. Il chevron `›` ruota di 90° per indicare lo stato aperto.

---

## ⚠️ Gestione degli errori

| Scenario | Comportamento |
|---|---|
| **Input vuoto** | Ricerca ignorata silenziosamente |
| **Città non trovata** | *"Città non trovata. Riprova con un altro nome."* |
| **Errore geocoding** | *"Errore nella richiesta di geocoding."* |
| **Errore dati meteo** | *"Errore nel recupero dei dati meteo."* |
| **Dati non disponibili** | *"Dati meteo non disponibili per questa città."* |

---

## 🌐 API utilizzate

Entrambe gratuite, senza chiave API — [Open-Meteo](https://open-meteo.com/).

### Geocoding
`GET https://geocoding-api.open-meteo.com/v1/search`

| Parametro | Valore |
|---|---|
| `name` | Nome città (URL-encoded) |
| `count` | `1` (ricerca meteo) / `6` (autocomplete) |
| `language` | `it` |
| `format` | `json` |

### Forecast
`GET https://api.open-meteo.com/v1/forecast`

| Parametro | Valore |
|---|---|
| `daily` | `weathercode, temperature_2m_max, temperature_2m_min, precipitation_sum, windspeed_10m_max, uv_index_max, sunrise, sunset` |
| `hourly` | `temperature_2m, precipitation_probability, windspeed_10m` |
| `timezone` | `auto` |
| `forecast_days` | `7` |

### Codici meteo WMO supportati

| Codici | Descrizione |
|---|---|
| 0 | Cielo sereno |
| 1, 2, 3 | Sereno → coperto |
| 45, 48 | Nebbia |
| 51–57 | Pioviggine (anche gelata) |
| 61–67 | Pioggia (anche gelata) |
| 71–77 | Neve e granelli |
| 80–86 | Rovesci e rovesci di neve |
| 95, 96, 99 | Temporale (anche con grandine) |

---

## 📁 Struttura del progetto

```
MeteoTrial/
├── index.html        # Struttura HTML con markup semantico e ARIA
├── style.css         # Tema dark, card espandibili, layout responsive
├── app.js            # Logica API, autocomplete, card con expand/collapse
├── test.js           # Test base (previsioni a 7/10/14 giorni)
├── test_suite.js     # Suite completa con 13 test e mock di fetch
└── README.md         # Questo file
```

---

## 🐛 Criticità note

| Criticità | Severità | Descrizione |
|---|---|---|
| **Validazione input limitata** | 🟡 Media | Ignora silenziosamente gli input vuoti ma non valida stringhe troppo lunghe o con soli caratteri speciali |
| **Duplicazione logica** | 🟡 Media | `fetchWeather` è replicata in `app.js`, `test.js` e `test_suite.js` anziché in un modulo condiviso |
| **Nessun feedback rete assente** | 🟡 Media | Se Internet non è disponibile, l'errore mostrato è generico (`fetch failed`) |
| **Date in Node.js** | 🟢 Bassa | `toLocaleDateString('it-IT')` può comportarsi diversamente su Node.js senza locale installati |
| **Nessun fallback font** | 🟢 Bassa | Google Fonts caricato da CDN; se irraggiungibile, si usa `sans-serif` |

---

## 🔮 Miglioramenti futuri

- [ ] Selettore giorni di previsione (1–16) con slider
- [ ] Geolocalizzazione automatica via `navigator.geolocation`
- [ ] Grafico temperature interattivo (Chart.js)
- [ ] Salvataggio città preferite con `localStorage`
- [ ] Toggle tema chiaro/scuro
- [ ] Supporto multilingua (EN, IT, ES, FR)
- [ ] PWA con supporto offline
- [ ] Debounce della ricerca durante la digitazione

---

## 📄 Licenza

Progetto a scopo didattico. Dati meteo forniti da [Open-Meteo](https://open-meteo.com/) sotto licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
