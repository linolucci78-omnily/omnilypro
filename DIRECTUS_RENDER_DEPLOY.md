# Guida Deploy Directus su Render

## Database Setup (COMPLETATO ✓)
- Database Neon PostgreSQL creato
- Bootstrap completato con successo
- Credenziali configurate in `.env`

## Deploy su Render

### Opzione 1: Deploy Manuale (CONSIGLIATO)

1. **Vai su Render Dashboard**
   - https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connetti Repository**
   - Seleziona il tuo repository GitHub omnilypro
   - Click "Connect"

3. **Configurazione Servizio**
   ```
   Name: omnilypro-directus
   Region: Frankfurt
   Branch: main
   Root Directory: directus
   Runtime: Node
   Build Command: npm install
   Start Command: npx directus start
   Instance Type: Free
   ```

   **IMPORTANTE**: Usa solo `npx directus start` (NON `bootstrap`) perché il database è già inizializzato!

4. **Environment Variables**

   Vai su "Environment" e aggiungi queste variabili:

   ```bash
   PUBLIC_URL=https://omnilypro-directus.onrender.com
   PORT=10000

   # Database
   DB_CLIENT=pg
   DB_HOST=ep-odd-meadow-abmedcu8-pooler.eu-west-2.aws.neon.tech
   DB_PORT=5432
   DB_DATABASE=neondb
   DB_USER=neondb_owner
   DB_PASSWORD=npg_Qu4E5KObaRBv
   DB_SSL=true

   # Security (IMPORTANTE: Usa queste chiavi)
   KEY=dc5840bd5abf20ea14d1986bd76443063b3a2f4d9f9f9bc8ac0df9ede45d1bb1
   SECRET=97d7936ed7d1accaee5ac19b35aa45109b50ec7a8f904690dea0cfa78f4bddf2fd20504071a9f60bc2cfacd9f0061fa99d28170fbb889baef811ad34e04cc408

   # Admin
   ADMIN_EMAIL=admin@omnilypro.com
   ADMIN_PASSWORD=OmnilyAdmin2024!

   # CORS
   CORS_ENABLED=true
   CORS_ORIGIN=https://omnilypro.vercel.app,https://omnilypro.com,https://*.omnilypro.com
   CORS_CREDENTIALS=true

   # Rate Limiting
   RATE_LIMITER_ENABLED=true
   RATE_LIMITER_POINTS=50
   RATE_LIMITER_DURATION=1

   # Storage
   STORAGE_LOCATIONS=local

   # Cache
   CACHE_ENABLED=false
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Attendi 3-5 minuti per il primo deploy
   - Controlla i logs per verificare che sia tutto ok

### Opzione 2: Blueprint (render.yaml)

Il file `render.yaml` è già configurato. Per usarlo:

1. Commit e push delle modifiche
2. Vai su Render Dashboard → "New" → "Blueprint"
3. Seleziona il repository
4. Configura le variabili d'ambiente (come sopra)
5. Deploy

## Accesso dopo il Deploy

1. **URL Admin Panel**: https://omnilypro-directus.onrender.com/admin
2. **Credenziali**:
   - Email: `admin@omnilypro.com`
   - Password: `OmnilyAdmin2024!`

## Test API

```bash
# Health check
curl https://omnilypro-directus.onrender.com/server/health

# Get items (richiede autenticazione)
curl https://omnilypro-directus.onrender.com/items/your_collection
```

## Troubleshooting

### Errore: Database connection failed
- Verifica che le credenziali Neon siano corrette
- Assicurati che `DB_SSL=true`
- Controlla che il database Neon sia attivo

### Errore: Bootstrap timeout
- Cambia start command in `npx directus start` (senza bootstrap)
- Il database è già inizializzato!

### Errore: Port binding
- Render usa automaticamente `PORT=10000`
- Non modificare questa variabile

### Servizio in sleep mode (piano Free)
- Il piano Free va in sleep dopo 15 min di inattività
- Si riattiva automaticamente alla prima richiesta (15-30 secondi)
- Per mantenerlo attivo: upgrade a piano Starter ($7/mese)

## Prossimi Passi

1. Creare le collections per i siti web
2. Configurare i permessi pubblici per leggere i dati
3. Integrare con il frontend OmnilyPro
4. Configurare storage esterno (Cloudinary/S3) per le immagini

## Note Importanti

- ✅ Database PostgreSQL su Neon (dedicato a Directus)
- ✅ Bootstrap completato localmente
- ⚠️ Piano Free: sleep dopo 15 min inattività
- ⚠️ Storage locale: i file caricati NON persistono tra i restart
- 💡 Per produzione: considera storage S3/Cloudinary

## Comandi Utili

```bash
# Test locale
cd directus && npm start

# Logs in tempo reale su Render
# Vai su Render Dashboard → tuo servizio → "Logs"

# Riavvia servizio
# Render Dashboard → tuo servizio → "Manual Deploy" → "Clear build cache & deploy"
```
