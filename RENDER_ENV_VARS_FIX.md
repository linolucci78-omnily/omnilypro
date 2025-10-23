# 🔧 Variabili Ambiente Render - FIX DATABASE CONNECTION

## ❌ CANCELLA TUTTE LE VARIABILI VECCHIE

Vai su **Render → omnilypro-strapi-cms → Environment** e cancella TUTTO.

---

## ✅ AGGIUNGI QUESTE NUOVE VARIABILI

Copia e incolla una per una:

### 1. Database Configuration (SEPARATE - non usare DATABASE_URL!)
```
DATABASE_CLIENT=postgres
```

```
DATABASE_HOST=ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech
```

```
DATABASE_PORT=5432
```

```
DATABASE_NAME=neondb
```

```
DATABASE_USERNAME=neondb_owner
```

```
DATABASE_PASSWORD=npg_ZUhFqO7XRv2A
```

```
DATABASE_SSL=true
```

```
DATABASE_SSL_REJECT_UNAUTHORIZED=false
```

### 2. Server Configuration
```
HOST=0.0.0.0
```

```
PORT=10000
```

```
NODE_ENV=production
```

### 3. Strapi Security Keys
```
APP_KEYS=86077fda24f6660eeb1d3dc00b9ee1c0,3f77b8031ec8dae1a15f1787396c11b5,027f6cb107b42015a644ceda043e6a21,e1eec54a3c2cb3ca9a94ba6dcd6de468
```

```
API_TOKEN_SALT=2dece4f312508f44a80003742390e3c0bfbb7bc4ac991a3f6e5f2ba3e68500a4
```

```
ADMIN_JWT_SECRET=9bdd42791de62828d625b38ceed5bdf5b865046dd6e3b252191e572df4b2c9ea
```

```
TRANSFER_TOKEN_SALT=2d30d83fa547a09c3246c37ad2a3c62d7b3378eb7a6e3db163b7244b6dcf6959
```

```
ENCRYPTION_KEY=e2927f3aaf1472de8c4930097ba67d1c53cfa36bcbe053284501770a692fac4d
```

```
JWT_SECRET=2cbc33008d9deaa420075adf07e972f333d2d70f731cfd863f150dd57807c641
```

---

## 📋 RIEPILOGO TOTALE

**Numero variabili**: 16

**Categorie**:
- Database: 8 variabili
- Server: 3 variabili
- Security: 5 variabili

---

## 🚀 DOPO AVER AGGIUNTO

1. Click **"Save Changes"**
2. Render farà automaticamente un nuovo deploy
3. Aspetta che completi il build
4. Controlla i logs per vedere se Strapi si avvia correttamente

---

## 🔍 COSA È CAMBIATO

**PRIMA** (non funzionava):
```
DATABASE_URL=postgresql://neondb_owner:npg_ZUhFqO7XRv2A@ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech/neondb
```
❌ Render troncava l'hostname a `ep-red-heart-abs55dqq-pooler.eu-w`

**ADESSO** (dovrebbe funzionare):
```
DATABASE_HOST=ep-red-heart-abs55dqq-pooler.eu-west-2.aws.neon.tech
DATABASE_PORT=5432
DATABASE_NAME=neondb
DATABASE_USERNAME=neondb_owner
DATABASE_PASSWORD=npg_ZUhFqO7XRv2A
```
✅ Variabili separate evitano il problema del troncamento

---

## ✅ CHECKLIST

- [ ] Cancellare tutte le vecchie variabili
- [ ] Copiare le 16 nuove variabili
- [ ] Salvare modifiche
- [ ] Aspettare deploy automatico
- [ ] Controllare logs
