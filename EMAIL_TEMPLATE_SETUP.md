# 📧 Configurazione Email Template OMNILY PRO

## Perché serve la Dashboard?

La tabella `auth.email_templates` di Supabase è **gestita internamente** e non è accessibile via SQL diretto. Devi configurarla tramite la Dashboard UI.

---

## 🚀 GUIDA RAPIDA (5 minuti)

### STEP 1: Accedi a Email Templates

1. Apri **Supabase Dashboard**: https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Nella sidebar sinistra, vai su:
   ```
   Authentication → Email Templates
   ```

### STEP 2: Seleziona il Template "Invite user"

Nella pagina Email Templates vedrai una lista di template:
- ✅ **Invite user** ← QUESTO È QUELLO CHE DEVI MODIFICARE
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password

Click su **"Invite user"**

### STEP 3: Configura Subject

Nel campo **Subject line**, inserisci:
```
Attiva il tuo Account OMNILY PRO
```

### STEP 4: Incolla il Template HTML

Nel grande campo di testo **Message (Body)**, **CANCELLA TUTTO** il contenuto esistente e incolla questo:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attiva il tuo Account OMNILY PRO</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); min-height: 100vh;">

  <table width="100%" cellpadding="0" cellspacing="0" style="min-height: 100vh; padding: 40px 20px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); overflow: hidden; max-width: 100%;">

          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#gradient)" stroke="url(#gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 17L12 22L22 17" fill="none" stroke="url(#gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M2 12L12 17L22 12" fill="none" stroke="url(#gradient)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">OMNILY PRO</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Piattaforma di Loyalty Management</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">

              <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 64px; height: 64px; margin: 0 auto; background: linear-gradient(135deg, #dbeafe 0%, #cffafe 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>

              <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 700; color: #1a1a1a; text-align: center;">Benvenuto in OMNILY PRO</h2>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">Ciao,</p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">La tua organizzazione è stata creata con successo! Ora puoi attivare il tuo account e iniziare a gestire il tuo programma di loyalty.</p>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4a4a4a;">Clicca sul pulsante qui sotto per impostare la tua password e accedere alla dashboard:</p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);">Attiva il Tuo Account</a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 20px; font-size: 14px; line-height: 1.6; color: #6b6b6b; text-align: center;">Oppure copia e incolla questo link nel tuo browser:</p>

              <div style="background: #f5f5f5; border: 1px solid #e5e5e5; border-radius: 8px; padding: 15px; word-break: break-all; font-family: monospace; font-size: 12px; color: #4a4a4a; text-align: center;">{{ .ConfirmationURL }}</div>

              <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #ecfeff 100%); border-left: 4px solid #3b82f6; border-radius: 8px;">
                <p style="margin: 0 0 10px; font-size: 14px; font-weight: 600; color: #1a1a1a;">Nota di Sicurezza</p>
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #4a4a4a;">Questo link di attivazione è valido per <strong>24 ore</strong>. Se non hai richiesto la creazione di questo account, ignora questa email.</p>
              </div>

            </td>
          </tr>

          <tr>
            <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 15px; font-size: 14px; color: #6b7280;">Hai bisogno di aiuto?</p>
              <p style="margin: 0 0 20px;"><a href="mailto:support@omnilypro.com" style="color: #3b82f6; text-decoration: none; font-weight: 600; font-size: 14px;">support@omnilypro.com</a></p>
              <div style="margin: 20px 0; height: 1px; background: #e5e7eb;"></div>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; 2025 OMNILY PRO. Tutti i diritti riservati.</p>
              <p style="margin: 10px 0 0; font-size: 11px; color: #9ca3af;">OMNILY PRO - Piattaforma di Loyalty Management</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

### STEP 5: Configura URL Redirect (IMPORTANTE!)

Scorri in basso nella stessa pagina fino a trovare la sezione **"URL Configuration"**.

Configura:

1. **Site URL**:
   - Development: `http://localhost:5173`
   - Production: `https://tuodominio.com`

2. **Redirect URLs** (click "+ Add URL" per aggiungere):
   - `http://localhost:5173/activate-account`
   - `http://localhost:5173/**` (per permettere tutti i path in development)

### STEP 6: Salva

Click sul pulsante verde **"Save"** in basso a destra.

---

## ✅ Verifica Configurazione

Dopo aver salvato, verifica:

1. Il Subject deve essere: `Attiva il tuo Account OMNILY PRO`
2. Il body deve iniziare con `<!DOCTYPE html>`
3. La Site URL deve essere impostata
4. Le Redirect URLs devono includere `/activate-account`

---

## 🧪 Come Testare

Dopo la configurazione:

1. Vai su `/admin/new-organization`
2. Compila il wizard con un'email VERA (tua email di test)
3. Completa la creazione
4. Controlla la tua inbox → dovresti ricevere l'email professionale OMNILY PRO
5. Click sul bottone "Attiva il Tuo Account"
6. Verrai reindirizzato a `/activate-account?token=...`
7. Imposta la password
8. Verrai reindirizzato alla dashboard

---

## ❓ Troubleshooting

### Non ricevo l'email

1. **Controlla spam/junk folder**
2. Verifica che l'email sia valida
3. Vai su Supabase Dashboard → Authentication → Users
4. Verifica che l'utente sia stato creato con status "Waiting for verification"

### Link di attivazione non funziona

1. Verifica che la Redirect URL sia configurata correttamente
2. Controlla che il link non sia scaduto (24 ore)
3. Verifica che il token sia presente nell'URL: `?token=...&type=recovery`

### Errore "auth.admin.createUser"

Questo significa che il client Supabase non ha i permessi admin.
- Verifica che stai usando la **Service Role Key** (non la anon key)
- In `organizationService.ts` dovrebbe usare `supabase.auth.admin.createUser()`

---

## 📝 Note Importanti

- Il template usa `{{ .ConfirmationURL }}` - Supabase lo sostituisce automaticamente
- L'email viene inviata quando chiami `supabase.auth.admin.createUser({ email_confirm: false })`
- Il link è valido 24 ore (configurabile in Auth Settings → Email Auth)

---

## 🎨 Personalizzazioni Future

Se vuoi cambiare il design dell'email:
1. Modifica il codice HTML sopra
2. Torna su Dashboard → Email Templates → Invite user
3. Sostituisci il contenuto
4. Salva

Colori attuali:
- Primary Blue: `#3b82f6`
- Primary Cyan: `#06b6d4`
- Background gradient: `#3b82f6` → `#06b6d4`
