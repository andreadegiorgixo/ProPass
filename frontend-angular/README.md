# ProPass – frontend

Interfaccia web di ProPass (Angular 22). Parla con il backend Spring Boot di
`../backend-springboot/pass` attraverso un proxy di sviluppo.

## Avvio

1. Avvia il backend su `http://localhost:8080` (vedi `../backend-springboot/pass`).
2. `npm install` (la prima volta).
3. `npm start`, poi apri <http://localhost:3000>.

| Comando         | Cosa fa                                  |
| --------------- | ---------------------------------------- |
| `npm start`     | Dev server su `localhost:3000`           |
| `npm test`      | Test unitari (Vitest, una sola esecuzione con `-- --watch=false`) |
| `npm run build` | Build di produzione in `dist/propass`    |

## Come si collega al backend

- Il dev server gira sulla porta **3000**: è l'unica origine ammessa dal CORS del backend.
- `proxy.conf.json` inoltra `/api/*` a `http://localhost:8080/*` togliendo `/api`. Tutte le
  chiamate del frontend usano URL relativi `/api/...`: così il cookie di sessione `JSESSIONID`
  (HttpOnly) e il cookie `XSRF-TOKEN` sono della stessa origine e Angular aggiunge da solo
  l'header `X-XSRF-TOKEN` a POST, PUT e DELETE.
- All'avvio l'app chiama `GET /api/account/me`: 200 = sessione attiva, 401 = serve l'accesso.
- Un 401 su una richiesta normale significa sessione scaduta: si torna all'accesso con un avviso.
- Un 403 su una modifica indica un header `X-XSRF-TOKEN` mancante.
- In produzione serve lo stesso schema: frontend e `/api` sulla stessa origine (reverse proxy).

## Struttura

```
src/app/
  core/           api (un servizio per risorsa), sessione, guard, interceptor, cornice
  shared/ui/      bottone, campo, icone, logo, finestra di conferma, toast
  features/
    auth/         accesso e registrazione
    vault/        elenco, ricerca, pannello password (VaultService = unico accesso ai dati)
    account/      dati personali, password dell'account, uscita, eliminazione
src/styles/
  tokens.css      colori, font, misure: l'unico posto in cui compaiono i valori
  base.css        reset e stili condivisi (campi, menu, finestre)
```

## Note

- **Ricerca**: con campo vuoto si carica `GET /api/password`; con del testo si interroga il
  backend dopo 300 ms di pausa. Filtro "Tutto" = nome, username e link insieme, risultati uniti
  senza duplicati. Un 404 di ricerca è "nessun risultato".
- **Dati in memoria**: le password non vengono mai scritte in `localStorage` o `sessionStorage`
  e spariscono all'uscita.
- **Font**: Onest e Geist Mono, installati da npm e serviti in locale (nessuna chiamata esterna).
- **Node**: Angular 22 supporta Node 22.22+, 24.15+ e 26+. Con Node 25 la CLI funziona ma stampa
  un avviso "Unsupported".
