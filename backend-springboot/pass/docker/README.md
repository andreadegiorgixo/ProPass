# ProPass – Oracle in Docker

Database Oracle Free 23ai per lo sviluppo locale di ProPass.

| File | Scopo |
|---|---|
| `docker-compose.yml` | Definizione del container (modifica qui se serve) |
| `.env` | Password e porta **reali**. Locale, ignorato da git |
| `.env.example` | Modello da copiare in `.env` su un'altra macchina |

## Comandi (da questa cartella)

```bash
docker compose up -d        # avvia (il primo avvio impiega ~1-2 minuti)
docker compose ps           # stato: deve diventare "healthy"
docker compose logs -f      # log di Oracle
docker compose stop         # ferma, i dati restano
docker compose down         # rimuove il container, i dati restano nel volume
docker compose down -v      # ATTENZIONE: cancella anche tutti i dati
```

## Porta

Il database è raggiungibile sulla porta **1522** del tuo computer (cambiala con
`ORACLE_HOST_PORT` nel file `.env` se è occupata). La porta è esposta solo su
`127.0.0.1`: non è raggiungibile dalla rete.

## Connessione da SQL Developer

Nuova connessione (+), poi:

| Campo | Valore |
|---|---|
| Name | `ProPass` |
| Username | `SYSTEM` |
| Password | il valore di `ORACLE_ADMIN_PASSWORD` nel file `.env` |
| Connection Type | Basic |
| Hostname | `localhost` |
| Port | `1522` |
| **Service name** | `PROPASS` (non "SID") |

L'utente per l'applicazione non e' creato dal container: si crea da SQL Developer
collegandosi come `SYSTEM` (Altri utenti → Crea utente) e dandogli i permessi per
creare tabelle e sequenze (es. `CONNECT`, `RESOURCE`, `UNLIMITED TABLESPACE`).

## Per Spring Boot (`application.properties`)

```properties
spring.datasource.url=jdbc:oracle:thin:@//localhost:1522/PROPASS
spring.datasource.username=<utente creato da te>
spring.datasource.password=<password di quell'utente>
```

## Note

- Lo schema delle tabelle lo crea Flyway dall'applicazione, non questo container.
- Le password cambiate in `.env` dopo il primo avvio **non** hanno effetto sui dati
  già creati: servono `docker compose down -v` e un nuovo `up -d` (cancella i dati).
