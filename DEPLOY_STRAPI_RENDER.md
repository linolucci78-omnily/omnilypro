# 🚀 Deploy Strapi CMS su Render.com

## 📋 Prerequisiti
- Account Render.com (gratis: https://render.com)
- Repository GitHub con il progetto OmnilyPro

---

## STEP 1: Crea Database PostgreSQL su Render

1. **Vai su Render Dashboard** → https://dashboard.render.com
2. **New +** → **PostgreSQL**
3. **Configurazione**:
   - **Name**: `omnilypro-strapi-db`
   - **Database**: `strapi` (auto-generato)
   - **User**: `strapi` (auto-generato)
   - **Region**: Frankfurt (o più vicino a te)
   - **Plan**: **Free** (0$/mese)
4. **Create Database**
5. **Copia l'URL**: Vedrai "Internal Database URL" - **COPIALO** (serve dopo)
   ```
   postgresql://strapi:password@hostname/database
   ```

---

## STEP 2: Deploy Strapi Web Service

1. **Render Dashboard** → **New +** → **Web Service**
2. **Connect Repository**:
   - Se prima volta: Autorizza GitHub
   - Seleziona repository `omnilypro`
3. **Configurazione Deploy**:
   - **Name**: `omnilypro-strapi-cms`
   - **Region**: Frankfurt (stesso del database)
   - **Root Directory**: `cms` ⚠️ IMPORTANTE!
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: **Free** (0$/mese, limite 750h/mese)

---

## STEP 3: Variabili Ambiente

Nella sezione **Environment Variables**, aggiungi:

### **Database** (usa l'URL copiato prima)
```bash
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://strapi:password@hostname/database
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

### **Server**
```bash
HOST=0.0.0.0
PORT=10000
NODE_ENV=production
```

### **Secrets** (genera nuovi valori casuali!)
```bash
# Usa questo comando per generare random keys:
# node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"

APP_KEYS=YOUR_RANDOM_KEY_1,YOUR_RANDOM_KEY_2,YOUR_RANDOM_KEY_3,YOUR_RANDOM_KEY_4
API_TOKEN_SALT=YOUR_RANDOM_SALT
ADMIN_JWT_SECRET=YOUR_RANDOM_JWT_SECRET
TRANSFER_TOKEN_SALT=YOUR_RANDOM_TRANSFER_SALT
ENCRYPTION_KEY=YOUR_RANDOM_ENCRYPTION_KEY
JWT_SECRET=YOUR_RANDOM_JWT_SECRET_2
```

### **CORS** (URL del tuo frontend Vercel)
```bash
CLIENT_URL=https://your-app.vercel.app
```

**💡 Tip**: Puoi generare random keys con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. **Create Web Service** (Render inizierà il deploy, aspetta 5-10 minuti)

---

## STEP 4: Verifica Deploy

1. **Aspetta che Build finisca** (vedrai "Live" in verde)
2. **Apri URL**: `https://omnilypro-strapi-cms.onrender.com`
3. **Dovresti vedere**: Pagina Strapi admin
4. **Primo accesso**:
   - Vai su: `https://omnilypro-strapi-cms.onrender.com/admin`
   - **Crea primo admin user**:
     - Email: tua-email@esempio.com
     - Password: (almeno 8 caratteri)

---

## STEP 5: Crea API Token

1. **Login su Strapi Admin** → https://omnilypro-strapi-cms.onrender.com/admin
2. **Settings** (barra sinistra)
3. **API Tokens** → **Create new API Token**
4. **Configurazione**:
   - **Name**: `Frontend Vercel Token`
   - **Token duration**: Unlimited
   - **Token type**: Full access
5. **Save** → **COPIA IL TOKEN** (lo vedi solo una volta!)

---

## STEP 6: Aggiorna Vercel Environment Variables

1. **Vai su Vercel Dashboard** → https://vercel.com
2. **Seleziona progetto** `omnilypro`
3. **Settings** → **Environment Variables**
4. **Aggiungi/Aggiorna**:
   ```bash
   VITE_STRAPI_URL=https://omnilypro-strapi-cms.onrender.com
   VITE_STRAPI_API_TOKEN=your-token-from-step-5
   ```
5. **Applica a**: Production, Preview, Development
6. **Save**

---

## STEP 7: Redeploy Vercel

1. **Vercel Dashboard** → **Deployments**
2. **Ultimo deployment** → **⋯ (tre puntini)** → **Redeploy**
3. Aspetta build (2-3 minuti)
4. **Visita il sito** → Dovrebbe funzionare!

---

## ✅ TEST FINALE

Vai sul tuo frontend Vercel:
1. **Login** → **Dashboard** → **Il Mio Sito Web**
2. **Dovresti vedere** editor del sito
3. **Se funziona** = TUTTO OK! 🎉

---

## 🐛 Troubleshooting

### **Problema: "Build failed on Render"**
- **Check logs**: Render Dashboard → Service → Logs
- **Errore comune**: Node version mismatch
  - **Soluzione**: Aggiungi `NODE_VERSION=18` in Environment Variables

### **Problema: "Database connection failed"**
- **Verifica**: `DATABASE_URL` corretto in Environment Variables
- **Verifica**: Database è nello stesso region del Web Service
- **Riavvia**: Render Dashboard → Manual Deploy → Deploy latest commit

### **Problema: "CORS error" sul frontend**
- **Verifica**: `CLIENT_URL` in Strapi env vars è corretto
- **Verifica**: middlewares.js ha la config CORS aggiornata
- **Redeploy**: Strapi dopo cambio config

### **Problema: "Render Free tier va in sleep"**
- **Causa**: Free plan dorme dopo 15min inattività
- **Soluzione temporanea**: Usa cron-job.org per ping ogni 10min
- **Soluzione definitiva**: Upgrade a $7/mese paid plan

---

## 💰 Costi

**Piano FREE (attuale)**:
- Database PostgreSQL: **$0/mese** (limite 1GB storage)
- Web Service: **$0/mese** (limite 750h/mese, va in sleep dopo 15min)
- **TOTALE: €0/mese**

**Piano PAID (consigliato per produzione)**:
- Database: **$7/mese** (no limiti)
- Web Service: **$7/mese** (sempre attivo)
- **TOTALE: €14/mese (~$15/mese)**

---

## 🔐 Sicurezza

**IMPORTANTE**:
- ✅ Genera nuovi secrets random (non usare quelli del .env locale!)
- ✅ Salva token API in password manager
- ✅ NON committare secrets su GitHub
- ✅ Usa HTTPS sempre (Render lo fornisce gratis)

---

## 📊 Monitoring

**Render Free Tier**:
- Max 750 ore/mese (= ~25 giorni)
- Se superi → servizio si ferma fino a mese successivo
- **Soluzione**: Monitora su Render Dashboard

---

## 🚀 Prossimi Passi

Una volta deployato:
1. ✅ Testa creazione sito web dal frontend
2. ✅ Carica template base in Strapi
3. ✅ Configura backup automatico database
4. ✅ Setup monitoring (UptimeRobot gratis)

---

**Hai problemi?** Controlla logs:
- **Render**: Dashboard → Service → Logs
- **Vercel**: Dashboard → Deployments → Build Logs
