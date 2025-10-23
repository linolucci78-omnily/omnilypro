# Esecuzione Migrazione Sistema Contratti e Firma Digitale

## Metodo 1: Supabase Dashboard (CONSIGLIATO)

1. Vai su [Supabase Dashboard](https://app.supabase.com/project/sjvatdnvewohvswfrdiv)
2. Nel menu laterale, seleziona **SQL Editor**
3. Clicca su **+ New Query**
4. Copia e incolla tutto il contenuto del file `database/migrations/015_create_contracts_esignature_system.sql`
5. Clicca su **Run** (o premi Ctrl+Enter)
6. Verifica che la migrazione sia completata senza errori

## Metodo 2: psql CLI

Se hai PostgreSQL installato localmente:

```bash
# Assicurati di avere la DATABASE_URL configurata
psql "postgresql://postgres:[PASSWORD]@db.sjvatdnvewohvswfrdiv.supabase.co:5432/postgres" \
  -f database/migrations/015_create_contracts_esignature_system.sql
```

## Verifica Installazione

Dopo aver eseguito la migrazione, verifica che le tabelle siano state create:

1. Nel Supabase Dashboard, vai su **Table Editor**
2. Dovresti vedere le nuove tabelle:
   - `contract_templates`
   - `contracts`
   - `contract_signatures`
   - `signature_audit_log`
   - `contract_notifications`

## Tabelle Create

La migrazione crea il seguente schema:

- **contract_templates**: Template riutilizzabili per i contratti
- **contracts**: Istanze dei contratti creati
- **contract_signatures**: Firme digitali (con OTP verification)
- **signature_audit_log**: Log completo di audit per compliance
- **contract_notifications**: Tracciamento email/SMS inviati

## Funzionalità Incluse

✅ Sistema OTP per verifica identità
✅ Firme digitali conformi eIDAS (EU)
✅ Audit trail completo per compliance legale
✅ Gestione multi-firma (cliente + fornitore)
✅ Tracking completo dello stato del contratto
✅ Notifiche email/SMS
✅ Row Level Security (RLS) configurato

## Test Post-Migrazione

Dopo la migrazione, puoi testare il sistema:

1. Vai su **Admin Dashboard** → **CRM & Marketing**
2. Apri un lead esistente
3. Vai al tab **Contratti**
4. Crea un nuovo contratto
5. Invia il contratto per la firma
6. Usa il link generato per simulare la firma

## Troubleshooting

Se ricevi errori:

- **Errore "already exists"**: Le tabelle esistono già, puoi ignorare
- **Errore "permission denied"**: Verifica di essere connesso con l'utente postgres
- **Errore "function does not exist"**: Esegui prima le migrazioni precedenti

## Supporto

Per problemi con la migrazione, contatta il team di sviluppo.
