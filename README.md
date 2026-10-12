# ProPass

Web app per salvare e cercare le proprie credenziali, costruita come progetto di
studio full stack: **Spring Boot** + **Oracle** (in Docker) + **Angular**.

> **Progetto didattico: non usarlo per password reali.**
> Le password salvate nel vault sono conservate **in chiaro** nel database (vedi
> [Limiti noti](#limiti-noti)). Lo schema zero-knowledge pensato per il progetto
> non è ancora implementato.

## Cosa fa

- Registrazione, login e logout con sessione lato server.
- Vault personale: aggiungi, modifica, elimina e consulta le credenziali (nome,
  username, password, link, note).
- Ricerca per nome, username o link (parziale e senza distinzione tra maiuscole e
  minuscole).
- Gestione dell'account: modifica dei dati e cancellazione dell'account con tutte le
  sue password.

## Stack

| Livello | Tecnologie |
|---|---|
| Backend | Java 21, Spring Boot 4 (milestone `4.2.0-M2`), Spring Security, Spring Data JPA, MapStruct, Lombok |
| Database | Oracle Free 23ai in Docker, schema versionato con Flyway |
| Frontend | Angular 22 (standalone, zoneless), TypeScript, Vitest |
| Test backend | Testcontainers (Oracle Free) |

## Struttura del repository

```
backend-springboot/pass/   API REST (Maven wrapper incluso)
  docker/                  Oracle in Docker per lo sviluppo locale
frontend-angular/          interfaccia web
```

Il backend è organizzato a livelli: `controller` → `service` → `repository`, con
`entity`, `dto`, `mapper` ed `exception` in package separati.

## Avvio in locale

Servono Docker, Java 21 e Node.js (versione LTS recente).

**1. Database**

```bash
cd backend-springboot/pass/docker
cp .env.example .env          # scegli ORACLE_ADMIN_PASSWORD
docker compose up -d          # attendi lo stato "healthy"
```

Poi crea un utente applicativo sul database `PROPASS` (non usare `SYSTEM`): i passaggi
sono in [`backend-springboot/pass/docker/README.md`](backend-springboot/pass/docker/README.md).

**2. Backend** (porta 8080)

```bash
cd backend-springboot/pass
cp .env.example .env          # inserisci DB_USERNAME e DB_PASSWORD dell'utente creato
./mvnw spring-boot:run
```

Lo schema delle tabelle viene creato da Flyway al primo avvio.

**3. Frontend** (porta 3000)

```bash
cd frontend-angular
npm install
npm start
```

Apri <http://localhost:3000>. Le chiamate a `/api/*` sono inoltrate al backend
dal proxy di sviluppo.

## API

| Metodo | Percorso | Descrizione |
|---|---|---|
| `POST` | `/account` | registrazione |
| `POST` | `/auth/login` | login |
| `GET` / `PUT` / `DELETE` | `/account/me` | leggi, modifica, elimina il proprio account |
| `GET` | `/account/check/{email}` | verifica se un'email è già registrata |
| `POST` / `GET` | `/password` | crea una password / elenca le proprie |
| `GET` / `PUT` / `DELETE` | `/password/{id}` | leggi, modifica, elimina una password |
| `GET` | `/password/nomePassword`, `/username`, `/linkPassword` | ricerca |

Ogni operazione sul vault lavora solo sui dati dell'account in sessione.

## Sicurezza: com'è oggi

Implementato:

- password dell'account salvate con hash **Argon2**;
- sessione lato server con cookie, protezione **CSRF** (cookie `XSRF-TOKEN` + header);
- **CORS** limitato all'origine del frontend di sviluppo;
- ogni query sul vault è filtrata per l'account autenticato;
- nessun segreto nel repository: credenziali del database in file `.env` ignorati da
  git, con `.env.example` come modello.

## Limiti noti

- **Password del vault in chiaro nel database.** È il limite principale: chi legge il
  database legge le password. Lo schema zero-knowledge progettato (cifratura nel
  browser con Web Crypto, il server vede solo dati opachi) è la tappa successiva.
- Nessuna richiesta della password attuale quando si cambia la password dell'account.
- Nessun limite di lunghezza sui campi nei DTO: un valore più lungo della colonna
  produce un errore 500.
- Il backend usa una versione milestone di Spring Boot e il frontend una dipendenza
  (`lucide-angular`) tenuta con un `overrides` in `package.json`.

## Prossimi passi

- [ ] Cifratura lato client del vault (zero-knowledge)
- [ ] Validazioni di lunghezza e conferma della password attuale
- [ ] Test di integrazione per i controller
- [ ] Rate limiting sul login
