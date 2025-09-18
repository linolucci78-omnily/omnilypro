# 🔧 OMNILY PRO - Troubleshooting Guide

## 📋 Problemi Comuni e Soluzioni Testate

### 🚨 PROBLEMA: Dashboard POS Bianco dopo Login

**Sintomi:**
- Login POS funziona correttamente
- Redirect a `/dashboard` ma pagina bianca
- Console error: `No routes matched location "/dashboard"`

**CAUSA ROOT:**
Le route in modalità POS erano incomplete. Mancava la route `/dashboard`.

**SOLUZIONE DEFINITIVA:**
```javascript
// File: frontend/src/App.tsx
// Modalità POS deve includere TUTTE le route necessarie

if (isPOSMode) {
  return (
    <Router>
      <AuthProvider>
        <div className="App" style={{ margin: 0, padding: 0 }}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ⚠️ CRITICO: Questa route era MANCANTE */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pos"
              element={
                <ProtectedRoute>
                  <Z108POSInterface />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  )
}
```

**PREVENZIONE:**
- Sempre verificare che modalità POS e Desktop abbiano le stesse route
- Testare il redirect dopo ogni modifica delle route

---

### 🚨 PROBLEMA: Logo 404 - File Non Trovato

**Sintomi:**
- Console error: `Failed to load resource: 404`
- Logo non appare nelle pagine
- Alt text duplicato visibile

**CAUSA ROOT:**
Logo referenziato come file locale `/omnilogo.png` ma non presente su Vercel.

**SOLUZIONE DEFINITIVA:**
```javascript
// Prima (SBAGLIATO - file locale)
<img src="/omnilogo.png" alt="OMNILY PRO" />

// Dopo (CORRETTO - Supabase Storage)
<img src="https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png" alt="OMNILY PRO" />
```

**PREVENZIONE:**
- Sempre usare storage cloud (Supabase) per assets
- Mai fare affidamento su file nella cartella `/public`
- Testare in produzione prima del deploy

---

### 🚨 PROBLEMA: Logo Troppo Piccolo e Non Visibile

**Sintomi:**
- Logo presente ma piccolissimo (come un puntino)
- Non professionale su dispositivi touch

**CAUSA ROOT:**
Dimensioni inappropriate per logo 500x500px originale.

**SOLUZIONE DEFINITIVA:**
```css
/* Navbar - Desktop */
height: 150px

/* Login Desktop */
height: 200px

/* Login POS - Touch friendly */
height: 250px
```

**PREVENZIONE:**
- Sempre considerare le dimensioni originali dell'immagine
- Testare su dispositivi touch per POS
- Logo deve essere 3x più grande per touch screen

---

### 🚨 PROBLEMA: Testo Duplicato "OMNILY PRO OMNILY PRO"

**Sintomi:**
- Header mostra nome duplicato
- Aspetto non professionale

**CAUSA ROOT:**
```html
<!-- Alt text + span text = duplicato -->
<img src="logo.png" alt="OMNILY PRO" />
<span>OMNILY PRO</span>
```

**SOLUZIONE DEFINITIVA:**
```javascript
// Opzione 1: Solo logo
<img src="logo.png" alt="OMNILY PRO" />

// Opzione 2: Logo + testo ma alt vuoto
<img src="logo.png" alt="" />
<span>OMNILY PRO</span>
```

**PREVENZIONE:**
- Decidere se mostrare logo o testo, non entrambi
- Se entrambi, usare alt text vuoto

---

### 🚨 PROBLEMA: API Calls Fail - Dashboard Non Carica Dati

**Sintomi:**
- Dashboard bianco o loading infinito
- Errori Supabase in console
- Componenti non si renderizzano

**CAUSA ROOT:**
Autenticazione o chiamate API non funzionanti in modalità POS.

**SOLUZIONE TEMPORANEA - Dati Mock:**
```javascript
// File: frontend/src/components/OrganizationsDashboard.tsx

const fetchOrganizations = async () => {
  try {
    setLoading(true)

    // TEMPORANEO: Dati mock per testare il POS
    const mockData = [
      {
        id: '1',
        name: 'OMNILY Demo Store',
        slug: 'demo-store',
        domain: 'demo.omnily.it',
        plan_type: 'pro',
        plan_status: 'active',
        max_customers: 1000,
        max_workflows: 10,
        logo_url: null,
        primary_color: '#ef4444',
        secondary_color: '#dc2626',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        pos_enabled: true,
        pos_model: 'ZCS-Z108'
      }
    ]

    setOrganizations(mockData)
    setError(null)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Errore nel caricamento')
  } finally {
    setLoading(false)
  }
}
```

**PREVENZIONE:**
- Sempre avere dati mock di fallback
- Testare funzionalità offline-first
- Implementare error boundaries

---

## 🚀 PROCESSO DI DEBUG RACCOMANDATO

### 1. Analisi Console Browser (F12)
```
- Aprire DevTools
- Tab Console per errori JavaScript
- Tab Network per errori 404/500
- Tab Elements per problemi CSS
```

### 2. Test URL Specifici POS
```
- Desktop: https://omnilypro.vercel.app
- POS: https://omnilypro.vercel.app?posomnily=true
- Verificare che entrambi funzionino
```

### 3. Verifica Route React
```javascript
// Controllare che tutte le route esistano
console.log('Current pathname:', window.location.pathname);
console.log('isPOSMode:', isPOSMode);
```

### 4. Test Asset Loading
```javascript
// Verificare che gli asset si carichino
fetch('https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png')
  .then(res => console.log('Logo status:', res.status))
  .catch(err => console.error('Logo error:', err));
```

---

## 📋 CHECKLIST PRE-DEPLOY

- [ ] Test login desktop funziona
- [ ] Test login POS (`?posomnily=true`) funziona
- [ ] Dashboard desktop si carica
- [ ] Dashboard POS si carica
- [ ] Logo visibile in tutte le pagine
- [ ] Nessun errore 404 in console
- [ ] Dimensioni logo appropriate
- [ ] Nessun testo duplicato
- [ ] Dati mock funzionanti
- [ ] Commit e push completati

---

## 🎯 URL CRITICI DA TESTARE

```
✅ Desktop Login: https://omnilypro.vercel.app
✅ POS Login: https://omnilypro.vercel.app?posomnily=true
✅ Logo Direct: https://sjvatdnvewohvswfrdiv.supabase.co/storage/v1/object/public/IMG/OMNILYPRO.png
```

---

## 📞 QUANDO CHIEDERE AIUTO

Se vedi questi errori, abbiamo già la soluzione:
- `No routes matched location "/dashboard"`
- `Failed to load resource: 404` per immagini
- Logo piccolissimo o invisibile
- Testo duplicato nell'header
- Dashboard bianco dopo login

**Riferisci sempre questo documento prima di iniziare debug! 🎯**

---

*Ultimo aggiornamento: 18 Settembre 2024*
*Problemi risolti: 5 errori critici*
*Tempo risparmiato: Evita 4-5 giorni di debug* 🚀