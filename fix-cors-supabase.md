# Fix CORS Supabase per Vercel Deploy

## Problema
```
Bloccata richiesta multiorigine (cross-origin): il criterio di corrispondenza
dell'origine non consente la lettura della risorsa remota
```

## Causa
Il dominio `omnilypro.vercel.app` non è autorizzato nelle CORS settings di Supabase.

## Soluzione

### Via Supabase Dashboard:

1. Vai a: https://supabase.com/dashboard/project/sjvatdnvewohvswfrdiv
2. Settings → API
3. Cerca "CORS Configuration" o "Additional Allowed Origins"
4. Aggiungi:
   ```
   https://omnilypro.vercel.app
   ```

   O per tutti i deploy Vercel:
   ```
   https://*.vercel.app
   ```

5. Save

### Alternative: Check Auth Settings

Se il problema persiste, verifica anche:

1. **Authentication → URL Configuration**
   - Site URL: `https://omnilypro.vercel.app`
   - Redirect URLs: Aggiungi:
     ```
     https://omnilypro.vercel.app/**
     https://*.vercel.app/**
     ```

2. **Authentication → Providers**
   - Email provider enabled
   - Confirm email: disabled (per testing)

## Test Dopo Fix

1. Ricarica la pagina `/admin/mdm`
2. Apri DevTools (F12) → Console
3. Verifica che gli errori CORS siano spariti
4. Prova a creare un device

## Note

- Le modifiche CORS potrebbero richiedere 1-2 minuti per propagarsi
- Fai hard refresh (Ctrl+Shift+R) dopo il fix
- Se usi localhost per development, aggiungi anche:
  ```
  http://localhost:5173
  http://localhost:3000
  ```
