import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  Calendar,
  Bell,
  Package,
  Zap,
  Send,
  Activity,
  Key,
  Store,
  Printer,
  CheckCircle
} from 'lucide-react';
import './DocumentationInteractive.css';

// --- Dati MDM - Gestione Dispositivi con tutte le sottosezioni ---
const datiMDM = {
  dispositivi: {
    icona: <Smartphone />,
    titolo: "Gestione Dispositivi",
    sottosezioni: [
      {
        id: 'panoramica',
        titolo: "Panoramica Dispositivi",
        descrizione: "Visualizza e gestisci tutti i dispositivi Android collegati alla piattaforma MDM. Monitora lo stato, la posizione e le informazioni di ogni dispositivo in tempo reale.",
        puntiChiave: [
          "Visualizza lista completa di tutti i dispositivi registrati",
          "Monitora stato online/offline in tempo reale",
          "Controlla livello batteria e connessione WiFi",
          "Geolocalizza dispositivi sulla mappa interattiva"
        ],
        guida: {
          comeIniziare: [
            "Accedi alla Dashboard MDM dal menu laterale",
            "Clicca su 'Gestione Dispositivi' nella sezione principale",
            "La panoramica mostrerà tutti i dispositivi attualmente registrati",
            "Utilizza i filtri in alto per cercare dispositivi specifici"
          ],
          procedura: [
            {
              titolo: "Visualizzare i dettagli di un dispositivo",
              passi: [
                "Nella lista dispositivi, clicca sul dispositivo desiderato",
                "Si aprirà un pannello laterale con tutte le informazioni",
                "Visualizza: nome, modello, versione Android, IMEI, serial number",
                "Controlla stato batteria, storage disponibile, RAM utilizzata",
                "Verifica ultima sincronizzazione e ultima posizione GPS"
              ]
            },
            {
              titolo: "Utilizzare i filtri di ricerca",
              passi: [
                "Usa la barra di ricerca in alto per cercare per nome o IMEI",
                "Filtra per stato: Online, Offline, In manutenzione, Disattivato",
                "Filtra per location: seleziona uno specifico store o punto vendita",
                "Filtra per modello o versione Android per trovare dispositivi specifici",
                "Combina più filtri per ricerche avanzate"
              ]
            }
          ],
          esempiPratici: [
            "Verifica quanti dispositivi sono online in questo momento nel tuo store di Milano",
            "Controlla quali dispositivi hanno batteria inferiore al 20% per sostituirli",
            "Trova tutti i dispositivi Samsung Galaxy per applicare un aggiornamento specifico",
            "Identifica dispositivi che non si sincronizzano da più di 24 ore"
          ],
          troubleshooting: [
            {
              problema: "Dispositivo mostra stato 'Offline' ma è acceso",
              soluzione: "Verifica che il dispositivo abbia connessione internet attiva. Controlla le impostazioni WiFi o dati mobili. Riavvia l'app MDM Agent sul dispositivo."
            },
            {
              problema: "Non riesco a vedere alcuni dispositivi nella lista",
              soluzione: "Controlla i filtri applicati. Verifica che i dispositivi siano effettivamente registrati. Controlla i permessi del tuo account utente."
            },
            {
              problema: "Informazioni batteria non aggiornate",
              soluzione: "Le informazioni si aggiornano ogni sincronizzazione (default 15 minuti). Forza una sincronizzazione manuale dal menu azioni del dispositivo."
            }
          ]
        }
      },
      {
        id: 'comandi',
        titolo: "Comandi Dispositivi",
        descrizione: "Invia comandi remoti ai dispositivi per gestire configurazioni, installare app, bloccare o sbloccare funzionalità specifiche.",
        puntiChiave: [
          "Blocca/sblocca dispositivi da remoto",
          "Riavvia dispositivi con un click",
          "Cancella dati da remoto (wipe)",
          "Configura impostazioni di sistema"
        ],
        guida: {
          comeIniziare: [
            "Seleziona uno o più dispositivi dalla lista nella Panoramica",
            "Clicca sul pulsante 'Azioni' o 'Comandi' nella toolbar superiore",
            "Scegli il comando desiderato dal menu dropdown",
            "Conferma l'operazione - alcuni comandi richiedono conferma aggiuntiva"
          ],
          procedura: [
            {
              titolo: "Bloccare un dispositivo da remoto",
              passi: [
                "Seleziona il dispositivo target dalla lista",
                "Clicca su 'Azioni' → 'Blocca Dispositivo'",
                "Inserisci un messaggio da mostrare sullo schermo (opzionale)",
                "Imposta un PIN di sblocco temporaneo (opzionale)",
                "Conferma l'operazione - il dispositivo verrà bloccato entro 30 secondi"
              ]
            },
            {
              titolo: "Riavviare un dispositivo",
              passi: [
                "Seleziona il dispositivo dalla lista",
                "Clicca su 'Azioni' → 'Riavvia Dispositivo'",
                "Scegli se riavviare immediatamente o programmare il riavvio",
                "Conferma - il dispositivo si riavvierà automaticamente",
                "Monitora lo stato nella dashboard per verificare che torni online"
              ]
            },
            {
              titolo: "Factory Reset (Cancellazione dati)",
              passi: [
                "ATTENZIONE: Questa operazione è irreversibile!",
                "Seleziona il dispositivo dalla lista",
                "Clicca su 'Azioni' → 'Factory Reset' (icona rossa)",
                "Digita 'CONFERMA' nel campo di sicurezza",
                "Il dispositivo verrà resettato alle impostazioni di fabbrica",
                "Tutti i dati locali verranno cancellati permanentemente"
              ]
            },
            {
              titolo: "Configurare impostazioni WiFi",
              passi: [
                "Seleziona uno o più dispositivi",
                "Clicca su 'Azioni' → 'Configura WiFi'",
                "Inserisci SSID (nome rete) e password",
                "Scegli il tipo di sicurezza (WPA2, WPA3, etc)",
                "Conferma - i dispositivi si connetteranno automaticamente alla rete"
              ]
            }
          ],
          esempiPratici: [
            "Blocca tutti i dispositivi del punto vendita durante la chiusura serale per sicurezza",
            "Riavvia dispositivi che mostrano problemi di performance o app bloccate",
            "Configura WiFi su 20 nuovi dispositivi contemporaneamente senza doverlo fare manualmente",
            "Esegui factory reset su dispositivo rubato per proteggere i dati aziendali"
          ],
          troubleshooting: [
            {
              problema: "Il comando non viene eseguito sul dispositivo",
              soluzione: "Verifica che il dispositivo sia online e connesso a internet. I comandi vengono accodati e eseguiti alla prossima sincronizzazione. Attendi fino a 5 minuti per dispositivi offline."
            },
            {
              problema: "Dispositivo bloccato ma non riesco a sbloccarlo",
              soluzione: "Usa il PIN di sblocco impostato durante il blocco. Se dimenticato, contatta l'amministratore di sistema. In casi estremi, esegui uno sblocco forzato dalla dashboard."
            },
            {
              problema: "Factory reset non completato",
              soluzione: "Verifica che il dispositivo abbia almeno 30% di batteria. Il reset richiede alcuni minuti. Se il processo si blocca, forza riavvio manuale del dispositivo."
            },
            {
              problema: "Configurazione WiFi non applicata",
              soluzione: "Verifica che password e SSID siano corretti. Alcuni dispositivi richiedono riavvio per applicare nuove configurazioni WiFi. Controlla che il tipo di sicurezza sia supportato dal dispositivo."
            }
          ]
        }
      },
      {
        id: 'scheduler',
        titolo: "Scheduler Comandi",
        descrizione: "Pianifica l'esecuzione automatica di comandi MDM su dispositivi o gruppi di dispositivi in orari specifici.",
        puntiChiave: [
          "Crea schedule per comandi ricorrenti",
          "Imposta data e ora di esecuzione precisa",
          "Seleziona dispositivi singoli o gruppi",
          "Monitora storico esecuzioni programmate"
        ],
        guida: {
          comeIniziare: [
            "Naviga su 'Gestione Dispositivi' → 'Scheduler Comandi'",
            "Clicca sul pulsante 'Crea Nuovo Schedule' in alto a destra",
            "Compila il form con nome schedule, comando, dispositivi target e orario",
            "Salva lo schedule - verrà eseguito automaticamente all'orario impostato"
          ],
          procedura: [
            {
              titolo: "Creare uno schedule ricorrente",
              passi: [
                "Clicca su 'Crea Nuovo Schedule'",
                "Dai un nome descrittivo (es: 'Riavvio notturno POS')",
                "Seleziona il comando da eseguire (es: Riavvia Dispositivo)",
                "Scegli i dispositivi target o un gruppo",
                "Imposta la ricorrenza: Giornaliera, Settimanale, Mensile",
                "Specifica l'orario di esecuzione (es: 03:00 AM)",
                "Attiva lo schedule con il toggle e salva"
              ]
            },
            {
              titolo: "Programmare un comando one-time",
              passi: [
                "Crea nuovo schedule come sopra",
                "Seleziona 'Esecuzione Singola' invece di ricorrente",
                "Imposta data e ora specifica",
                "Il comando verrà eseguito una sola volta e lo schedule si disattiverà automaticamente"
              ]
            },
            {
              titolo: "Modificare uno schedule esistente",
              passi: [
                "Trova lo schedule nella lista",
                "Clicca sull'icona 'Modifica' (matita)",
                "Modifica i parametri desiderati",
                "Salva le modifiche - prenderanno effetto dalla prossima esecuzione"
              ]
            }
          ],
          esempiPratici: [
            "Riavvia automaticamente tutti i POS ogni notte alle 3:00 AM per ottimizzare performance",
            "Sincronizza configurazioni WiFi ogni lunedì mattina alle 8:00",
            "Esegui backup automatico dei log ogni domenica alle 23:00",
            "Blocca automaticamente i dispositivi fuori orario lavorativo (es: 22:00-07:00)"
          ],
          troubleshooting: [
            {
              problema: "Lo schedule non si è eseguito all'orario previsto",
              soluzione: "Verifica che lo schedule sia attivo (toggle verde). Controlla che i dispositivi fossero online al momento dell'esecuzione. Controlla i log di esecuzione per errori specifici."
            },
            {
              problema: "Schedule eseguito parzialmente (solo alcuni dispositivi)",
              soluzione: "Normale se alcuni dispositivi erano offline. Gli offline riceveranno il comando alla prossima sincronizzazione. Controlla la colonna 'Stato Esecuzione' per dettagli."
            },
            {
              problema: "Non riesco a eliminare uno schedule",
              soluzione: "Disattiva prima lo schedule con il toggle, poi clicca Elimina. Se lo schedule è in esecuzione, attendi il completamento prima di eliminarlo."
            }
          ]
        }
      },
      {
        id: 'alerts',
        titolo: "Sistema Alert",
        descrizione: "Configura notifiche automatiche per eventi critici come batteria scarica, dispositivi offline, tentativi di manomissione.",
        puntiChiave: [
          "Crea regole di alert personalizzate",
          "Imposta soglie per batteria e storage",
          "Dashboard alert in tempo reale",
          "Notifiche via email, SMS o push"
        ],
        guida: {
          comeIniziare: [
            "Vai su 'Gestione Dispositivi' → 'Sistema Alert'",
            "Clicca su 'Crea Nuova Regola' per configurare un alert",
            "Scegli il tipo di evento da monitorare (batteria, offline, ecc.)",
            "Configura destinatari e modalità di notifica"
          ],
          procedura: [
            {
              titolo: "Creare alert per batteria scarica",
              passi: [
                "Clicca 'Crea Nuova Regola'",
                "Seleziona tipo 'Batteria'",
                "Imposta soglia (es: 20% o 15%)",
                "Scegli dispositivi o gruppi da monitorare",
                "Configura destinatari email o numeri SMS",
                "Attiva l'alert e salva"
              ]
            },
            {
              titolo: "Configurare alert per dispositivi offline",
              passi: [
                "Crea nuova regola tipo 'Connettività'",
                "Imposta timeout (es: 1 ora, 6 ore, 24 ore)",
                "Quando un dispositivo resta offline oltre il timeout, parte l'alert",
                "Configura escalation: notifica amministratore dopo X ore"
              ]
            }
          ],
          esempiPratici: [
            "Alert batteria < 15%: sostituisci dispositivi prima che si spengano",
            "Alert offline > 2 ore: identifica problemi di connettività o furti",
            "Alert storage > 90%: libera spazio prima che le app crashino",
            "Alert tentativo root: notifica immediatamente manomissioni sospette"
          ],
          troubleshooting: [
            {
              problema: "Ricevo troppi alert (spam)",
              soluzione: "Aumenta le soglie o aggiungi un cooldown period tra notifiche. Configura filtri per escludere dispositivi specifici (es: test devices)."
            },
            {
              problema: "Non ricevo alert via email",
              soluzione: "Verifica che le email siano configurate correttamente in Impostazioni Email. Controlla spam/junk folder. Testa con 'Invia Test Alert'."
            }
          ]
        }
      },
      {
        id: 'apps',
        titolo: "Repository App",
        descrizione: "Carica, organizza e distribuisci applicazioni Android (APK) ai dispositivi gestiti. Supporta app custom e da Play Store.",
        puntiChiave: [
          "Carica file APK direttamente",
          "Organizza app per categoria",
          "Installa app su dispositivi multipli",
          "Traccia versioni installate"
        ],
        guida: {
          comeIniziare: [
            "Accedi a 'Gestione Dispositivi' → 'Repository App'",
            "Clicca 'Carica Nuova App' per aggiungere un APK",
            "Compila nome, versione, categoria e descrizione",
            "Carica il file APK (max 200MB per app)"
          ],
          procedura: [
            {
              titolo: "Caricare una nuova app",
              passi: [
                "Clicca 'Carica Nuova App'",
                "Seleziona file APK dal tuo computer",
                "Il sistema rileverà automaticamente: nome pacchetto, versione, permessi",
                "Aggiungi descrizione e screenshot (opzionale)",
                "Assegna categorie (Produttività, POS, Utility, ecc.)",
                "Salva nel repository"
              ]
            },
            {
              titolo: "Installare app su dispositivi",
              passi: [
                "Trova l'app nel repository",
                "Clicca 'Installa su Dispositivi'",
                "Seleziona dispositivi target o gruppi",
                "Scegli: Installazione immediata o programmata",
                "Conferma - l'installazione partirà automaticamente",
                "Monitora progresso nella dashboard"
              ]
            },
            {
              titolo: "Aggiornare app esistenti",
              passi: [
                "Carica nuova versione APK con stesso package name",
                "Il sistema rileverà automaticamente che è un aggiornamento",
                "Clicca 'Push Update' per distribuire ai dispositivi con vecchia versione",
                "Opzionale: rollout graduale (10%, 50%, 100%)"
              ]
            }
          ],
          esempiPratici: [
            "Carica la tua app POS custom e installala su tutti i terminali",
            "Aggiorna l'app inventory su 50 dispositivi simultaneamente",
            "Disinstalla versioni obsolete e forza update alla v2.0",
            "Organizza app per reparto: POS, Magazzino, Delivery"
          ],
          troubleshooting: [
            {
              problema: "APK non carica, errore 'File non valido'",
              soluzione: "Verifica che il file sia un APK valido e firmato. Dimensione max 200MB. Controlla che non sia corrotto."
            },
            {
              problema: "Installazione fallita su alcuni dispositivi",
              soluzione: "Verifica compatibilità versione Android minima. Alcuni dispositivi potrebbero avere poco storage. Controlla log errori specifici per dispositivo."
            },
            {
              problema: "App installata ma non si apre",
              soluzione: "Verifica permessi richiesti dall'app. Alcuni permessi potrebbero essere bloccati da policy MDM. Controlla crash logs sul dispositivo."
            }
          ]
        }
      },
      {
        id: 'bulk',
        titolo: "Operazioni in Blocco",
        descrizione: "Esegui operazioni su centinaia di dispositivi contemporaneamente. Risparmia tempo con azioni massive.",
        puntiChiave: [
          "Seleziona dispositivi con filtri avanzati",
          "Esegui comandi su tutti simultaneamente",
          "Monitora progresso in tempo reale",
          "Import/Export dati da CSV/Excel"
        ],
        guida: {
          comeIniziare: [
            "Vai su 'Gestione Dispositivi' → 'Operazioni in Blocco'",
            "Usa filtri per selezionare dispositivi (o importa da CSV)",
            "Scegli l'operazione da eseguire in massa",
            "Conferma e monitora l'esecuzione in tempo reale"
          ],
          procedura: [
            {
              titolo: "Eseguire comando su tutti i dispositivi",
              passi: [
                "Seleziona 'Tutti i dispositivi' o usa filtri (store, modello, ecc.)",
                "Clicca 'Azioni in Blocco'",
                "Scegli comando (es: Riavvia, Installa App, Configura WiFi)",
                "Vedi anteprima: quanti dispositivi saranno coinvolti",
                "Conferma esecuzione",
                "Dashboard mostra progresso in tempo reale: completati, in corso, falliti"
              ]
            },
            {
              titolo: "Importare dispositivi da CSV",
              passi: [
                "Clicca 'Importa da CSV'",
                "Scarica template CSV di esempio",
                "Compila CSV con: IMEI, Nome, Store, Modello",
                "Carica il file - il sistema validerà automaticamente",
                "Verifica anteprima importazione",
                "Conferma - i dispositivi verranno aggiunti al sistema"
              ]
            },
            {
              titolo: "Esportare inventario dispositivi",
              passi: [
                "Seleziona dispositivi con filtri o 'Tutti'",
                "Clicca 'Esporta Inventario'",
                "Scegli formato: CSV o Excel",
                "Seleziona campi da esportare (nome, IMEI, batteria, ecc.)",
                "Download file - utile per analisi in Excel o report"
              ]
            }
          ],
          esempiPratici: [
            "Riavvia tutti i 200 POS della catena alle 3 AM con un solo click",
            "Installa nuova versione app su tutti i dispositivi di uno store specifico",
            "Importa 50 nuovi dispositivi da CSV invece di registrarli uno per uno",
            "Esporta inventario completo per audit annuale o report management"
          ],
          troubleshooting: [
            {
              problema: "Import CSV fallisce con errori di validazione",
              soluzione: "Verifica formato colonne. IMEI deve essere numerico 15 cifre. Usa template fornito. Controlla caratteri speciali o encoding file (usa UTF-8)."
            },
            {
              problema: "Operazione in blocco bloccata al 50%",
              soluzione: "Alcuni dispositivi potrebbero essere offline. L'operazione continuerà quando torneranno online. Puoi annullare per dispositivi rimasti o attendere."
            },
            {
              problema: "Troppi dispositivi selezionati per errore",
              soluzione: "ATTENZIONE: verifica sempre filtri prima di confermare. Operazioni in blocco non sono annullabili (es: wipe). Usa 'Anteprima' prima di confermare."
            }
          ]
        }
      },
      {
        id: 'push',
        titolo: "Push Update App",
        descrizione: "Pubblica aggiornamenti di app in modo controllato. Rollout progressivo per testare stabilità.",
        puntiChiave: [
          "Carica nuove versioni APK",
          "Configura rollout graduale",
          "Rollback automatico in caso errori",
          "Dashboard stato aggiornamenti"
        ],
        guida: {
          comeIniziare: [
            "Carica nuova versione APK nel Repository App",
            "Vai su 'Push Update App'",
            "Seleziona l'app e la versione da distribuire",
            "Configura strategia rollout (immediato o graduale)"
          ],
          procedura: [
            {
              titolo: "Push update immediato (100% dispositivi)",
              passi: [
                "Seleziona app dal repository",
                "Clicca 'Push Update'",
                "Scegli 'Rollout Immediato - 100%'",
                "Tutti i dispositivi riceveranno l'aggiornamento subito",
                "Monitora dashboard per tracking installazioni"
              ]
            },
            {
              titolo: "Rollout graduale (staged rollout)",
              passi: [
                "Seleziona app e versione",
                "Scegli 'Rollout Graduale'",
                "Fase 1: 10% dispositivi (test pilot)",
                "Attendi 24-48h, monitora crash rate e feedback",
                "Se tutto ok, Fase 2: 50% dispositivi",
                "Finale: 100% - deploy completo",
                "Puoi bloccare/pausare rollout in qualsiasi momento"
              ]
            },
            {
              titolo: "Rollback in caso di problemi",
              passi: [
                "Se rilevi bug critici dopo update, clicca 'Rollback'",
                "Sistema reinstallerà automaticamente versione precedente",
                "Tutti i dispositivi torneranno alla versione stabile",
                "Investiga problema, fixa bug, riprova rollout"
              ]
            }
          ],
          esempiPratici: [
            "Update app POS: rollout graduale per evitare blocchi simultanei in tutti gli store",
            "Update critico sicurezza: push immediato 100% per patch vulnerability",
            "Nuova feature sperimentale: test su 10% dispositivi prima di deploy massivo",
            "Rollback automatico se crash rate supera 5% nelle prime 24h"
          ],
          troubleshooting: [
            {
              problema: "Rollout bloccato, alcuni dispositivi non aggiornano",
              soluzione: "Verifica che dispositivi siano online. Controlla spazio storage disponibile. Alcuni potrebbero avere policy che bloccano update automatici."
            },
            {
              problema: "Come annullare rollout in corso?",
              soluzione: "Clicca 'Pausa Rollout' per bloccare nuove installazioni. Dispositivi già aggiornati restano sulla nuova versione. Usa 'Rollback' per tornare tutti alla versione precedente."
            },
            {
              problema: "Dashboard mostra molte installazioni fallite",
              soluzione: "Controlla log errori specifici. Problemi comuni: storage pieno, versione Android incompatibile, permessi mancanti. Filtra per tipo errore e risolvi."
            }
          ]
        }
      },
      {
        id: 'logs',
        titolo: "Activity Logs",
        descrizione: "Accedi a log dettagliati di tutte le operazioni MDM. Ricerca avanzata per audit e troubleshooting.",
        puntiChiave: [
          "Log in tempo reale",
          "Filtri avanzati per data/utente/azione",
          "Audit trail completo",
          "Esporta log per compliance"
        ],
        guida: {
          comeIniziare: [
            "Accedi a 'Gestione Dispositivi' → 'Activity Logs'",
            "Visualizza log in tempo reale di tutte le operazioni",
            "Usa filtri per cercare eventi specifici",
            "Esporta log per analisi o compliance"
          ],
          procedura: [
            {
              titolo: "Ricercare eventi specifici",
              passi: [
                "Usa barra ricerca per keyword (es: 'factory reset', 'login', 'install')",
                "Filtra per data: oggi, ultima settimana, range personalizzato",
                "Filtra per utente: vedi azioni di uno specifico amministratore",
                "Filtra per dispositivo: storico completo di un dispositivo",
                "Filtra per tipo azione: comandi, alert, configurazioni, ecc.",
                "Combina filtri per ricerche avanzate"
              ]
            },
            {
              titolo: "Esportare log per audit",
              passi: [
                "Applica filtri desiderati (es: ultimo mese, tutti gli admin)",
                "Clicca 'Esporta Log'",
                "Scegli formato: CSV, Excel, o PDF",
                "Seleziona campi: timestamp, utente, azione, dispositivo, risultato",
                "Download report - ideale per audit compliance o report management"
              ]
            }
          ],
          esempiPratici: [
            "Audit: Chi ha eseguito factory reset sul dispositivo ABC123 il 15 gennaio?",
            "Troubleshooting: Quali comandi sono stati inviati al dispositivo crashato?",
            "Compliance: Export log ultimi 12 mesi per certificazione ISO",
            "Security: Identifica login amministratore fuori orario lavorativo"
          ],
          troubleshooting: [
            {
              problema: "Non trovo un log specifico che so essere stato eseguito",
              soluzione: "Verifica filtri applicati. Controlla range date. Alcuni log potrebbero essere archiviati dopo 90 giorni - contatta support per recupero da backup."
            },
            {
              problema: "Export log troppo grande, file non si apre",
              soluzione: "Riduci range date o usa più filtri. Per export massivi, usa formato CSV invece di Excel. Considera export in più batch."
            }
          ]
        }
      },
      {
        id: 'tokens',
        titolo: "Setup Tokens",
        descrizione: "Genera token di enrollment sicuri per registrare nuovi dispositivi alla piattaforma MDM.",
        puntiChiave: [
          "Genera token usa-e-getta",
          "Imposta scadenza token",
          "QR code per enrollment veloce",
          "Monitora utilizzo token"
        ],
        guida: {
          comeIniziare: [
            "Vai su 'Gestione Dispositivi' → 'Setup Tokens'",
            "Clicca 'Genera Nuovo Token'",
            "Configura parametri: nome, scadenza, numero utilizzi",
            "Usa token generato (codice o QR) per registrare nuovi dispositivi"
          ],
          procedura: [
            {
              titolo: "Generare token per enrollment dispositivi",
              passi: [
                "Clicca 'Genera Nuovo Token'",
                "Dai un nome descrittivo (es: 'Token Store Milano - Gennaio 2025')",
                "Imposta scadenza: 24h, 7 giorni, 30 giorni, mai",
                "Imposta limite utilizzi: usa-e-getta (1), 10, 100, illimitato",
                "Opzionale: assegna pre-configurazioni (WiFi, app, policy)",
                "Genera - ricevi codice alfanumerico e QR code"
              ]
            },
            {
              titolo: "Utilizzare token per registrare dispositivo",
              passi: [
                "Sul dispositivo Android, installa OmnilyPro MDM Agent",
                "Apri app e clicca 'Registra Dispositivo'",
                "Scansiona QR code o inserisci codice manualmente",
                "Il dispositivo si registrerà automaticamente alla piattaforma",
                "Pre-configurazioni verranno applicate automaticamente"
              ]
            },
            {
              titolo: "Gestire e revocare token",
              passi: [
                "Visualizza lista tutti i token generati",
                "Controlla stato: Attivo, Scaduto, Esaurito",
                "Vedi quante volte è stato usato ogni token",
                "Revoca token compromessi o non più necessari",
                "Token revocati non possono più essere usati per enrollment"
              ]
            }
          ],
          esempiPratici: [
            "Token usa-e-getta per registrare dispositivo demo cliente",
            "Token 24h con limite 50 utilizzi per evento aziendale",
            "Token permanente per partner/rivenditori autorizzati",
            "QR code stampato per enrollment rapido nuovi dipendenti"
          ],
          troubleshooting: [
            {
              problema: "Token non funziona, errore 'Token non valido'",
              soluzione: "Verifica che token non sia scaduto o revocato. Controlla limite utilizzi non raggiunto. Verifica connessione internet dispositivo."
            },
            {
              problema: "Dispositivo registrato ma senza configurazioni",
              soluzione: "Pre-configurazioni vengono applicate solo se associate al token. Applica manualmente configurazioni dopo enrollment o rigenera token con pre-config."
            },
            {
              problema: "Ho perso un token, rischi di sicurezza?",
              soluzione: "Revoca immediatamente il token dalla dashboard. Token revocati non possono più registrare nuovi dispositivi. Genera nuovo token per sostituirlo."
            }
          ]
        }
      },
      {
        id: 'stores',
        titolo: "Configurazioni Store",
        descrizione: "Configura gli store/punti vendita con impostazioni specifiche per dispositivi POS e gestione locale.",
        puntiChiave: [
          "Crea profili store personalizzati",
          "Assegna dispositivi a store",
          "Vista aggregata tutti gli store",
          "KPI per singolo store"
        ],
        guida: {
          comeIniziare: [
            "Accedi a 'Gestione Dispositivi' → 'Configurazioni Store'",
            "Clicca 'Aggiungi Nuovo Store' per creare punto vendita",
            "Compila informazioni: nome, indirizzo, orari, manager",
            "Assegna dispositivi allo store creato"
          ],
          procedura: [
            {
              titolo: "Creare un nuovo store",
              passi: [
                "Clicca 'Aggiungi Nuovo Store'",
                "Inserisci nome (es: 'OmnilyPro Milano Centro')",
                "Indirizzo completo e coordinate GPS (per geo-fence)",
                "Orari apertura/chiusura (per automazioni)",
                "Manager/responsabile store",
                "Impostazioni specifiche: WiFi, stampanti, policy",
                "Salva store"
              ]
            },
            {
              titolo: "Assegnare dispositivi a uno store",
              passi: [
                "Seleziona store dalla lista",
                "Clicca 'Gestisci Dispositivi'",
                "Aggiungi dispositivi dalla lista generale",
                "Dispositivi assegnati erediteranno configurazioni store",
                "Puoi spostare dispositivi tra store in qualsiasi momento"
              ]
            },
            {
              titolo: "Configurare geo-fence per sicurezza",
              passi: [
                "Imposta coordinate GPS store",
                "Definisci raggio geo-fence (es: 100m, 500m)",
                "Configura azioni: alert se dispositivo esce dal perimetro",
                "Utile per prevenire furti o uso dispositivi fuori sede"
              ]
            }
          ],
          esempiPratici: [
            "Catena retail: configura 50 store con policy specifiche per regione",
            "Franchising: ogni store ha WiFi e stampanti diverse",
            "Alert automatico se dispositivo POS esce dallo store (furto)",
            "Dashboard CEO: KPI aggregati tutti gli store in tempo reale"
          ],
          troubleshooting: [
            {
              problema: "Dispositivo non eredita configurazioni store",
              soluzione: "Verifica che dispositivo sia effettivamente assegnato allo store. Forza sincronizzazione manuale. Alcune configurazioni richiedono riavvio dispositivo."
            },
            {
              problema: "Alert geo-fence falsi positivi",
              soluzione: "GPS può avere imprecisioni 10-50m. Aumenta raggio geo-fence. Configura cooldown period per evitare alert multipli."
            },
            {
              problema: "Come eliminare uno store?",
              soluzione: "Riassegna prima tutti i dispositivi ad altri store. Store vuoti possono essere eliminati. Store con dispositivi attivi non eliminabili per sicurezza."
            }
          ]
        }
      },
      {
        id: 'print',
        titolo: "Template di Stampa",
        descrizione: "Crea e personalizza template di stampa per scontrini, etichette, report da dispositivi POS.",
        puntiChiave: [
          "Editor visuale drag-and-drop",
          "Supporto logo e immagini",
          "Push template a dispositivi/gruppi",
          "Versioning automatico"
        ],
        guida: {
          comeIniziare: [
            "Vai su 'Gestione Dispositivi' → 'Template di Stampa'",
            "Clicca 'Crea Nuovo Template'",
            "Usa editor visuale per disegnare layout scontrino",
            "Distribuisci template ai dispositivi POS"
          ],
          procedura: [
            {
              titolo: "Creare template scontrino personalizzato",
              passi: [
                "Clicca 'Crea Nuovo Template'",
                "Scegli tipo: Scontrino Vendita, Ricevuta, Etichetta, Report",
                "Usa editor drag-and-drop per aggiungere elementi:",
                "- Logo aziendale (upload immagine)",
                "- Testo statico (nome store, P.IVA, contatti)",
                "- Variabili dinamiche (data, importo, prodotti, cliente)",
                "- Codici a barre o QR code",
                "- Linee separatrici e formattazione",
                "Anteprima real-time con dati di esempio",
                "Salva template"
              ]
            },
            {
              titolo: "Distribuire template ai dispositivi",
              passi: [
                "Seleziona template dalla lista",
                "Clicca 'Distribuisci'",
                "Scegli dispositivi o store target",
                "Push template - verrà sincronizzato entro 5 minuti",
                "Testa stampa da remoto per verificare correttezza"
              ]
            },
            {
              titolo: "Gestire versioni template",
              passi: [
                "Sistema mantiene storico versioni automaticamente",
                "Modifica template crea nuova versione (v1, v2, v3)",
                "Puoi fare rollback a versione precedente",
                "Dispositivi ricevono sempre ultima versione pubblicata"
              ]
            }
          ],
          esempiPratici: [
            "Template scontrino stagionale: logo natalizio dicembre, standard resto anno",
            "Template multi-lingua: italiano/inglese in base a setting dispositivo",
            "Template promo: spazio per QR code coupon sconto prossimo acquisto",
            "Template etichette prodotto: codice a barre, prezzo, descrizione"
          ],
          troubleshooting: [
            {
              problema: "Stampa non corretta, layout spezzato",
              soluzione: "Verifica larghezza template compatibile con stampante (58mm o 80mm standard). Alcuni elementi troppo larghi vengono troncati. Testa anteprima prima di deploy."
            },
            {
              problema: "Logo non si stampa o appare pixelato",
              soluzione: "Usa immagini PNG o JPG max 300KB. Risoluzione ideale 200-300 DPI. Immagini troppo grandi rallentano stampa. Converti a bianco/nero per stampanti termiche."
            },
            {
              problema: "Variabile dinamica non popolata (es: {{cliente}} vuoto)",
              soluzione: "Verifica che app POS passi correttamente i dati alla print API. Alcune variabili sono opzionali. Testa con 'Stampa Test' e dati mock."
            },
            {
              problema: "Template distribuito ma dispositivi usano ancora vecchia versione",
              soluzione: "Forza sincronizzazione dispositivi. Alcune stampanti cachano template - riavvia servizio stampa. Verifica che dispositivi abbiano ricevuto update nei log."
            }
          ]
        }
      }
    ]
  }
};

type SezioneID = keyof typeof datiMDM;

// Card per le Funzionalità Chiave
const PuntoChiaveCard: React.FC<{ text: string }> = ({ text }) => (
  <div className="docs-feature-card">
    <div className="docs-feature-icon">
      <CheckCircle size={20} strokeWidth={2.5} />
    </div>
    <span className="docs-feature-text">{text}</span>
  </div>
);

const DocumentationInteractive: React.FC = () => {
  const [sottosezioneAttiva, setSottosezioneAttiva] = useState(datiMDM.dispositivi.sottosezioni[0].id);
  const [categoriaAperta, setCategoriaAperta] = useState(true);

  const sezioneCorrente = datiMDM.dispositivi;
  const sottosezioneCorrente = sezioneCorrente.sottosezioni.find(s => s.id === sottosezioneAttiva) || sezioneCorrente.sottosezioni[0];

  const animationKey = useMemo(() => `content-${sottosezioneAttiva}`, [sottosezioneAttiva]);

  const toggleCategoria = () => {
    setCategoriaAperta(!categoriaAperta);
  };

  return (
    <div className="docs-container">
      {/* Sidebar di Navigazione */}
      <aside className="docs-sidebar">
        <h1>Documentazione</h1>
        <p className="docs-sidebar-subtitle">MDM Platform</p>

        <nav className="docs-nav">
          <div className="docs-nav-section">
            <button className="docs-nav-header" onClick={toggleCategoria}>
              <div className="docs-nav-icon">{sezioneCorrente.icona}</div>
              <span className="docs-nav-title">{sezioneCorrente.titolo}</span>
              <svg
                className={`docs-chevron ${categoriaAperta ? 'open' : ''}`}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 8l4 4 4-4" />
              </svg>
            </button>

            {categoriaAperta && (
              <div className="docs-subsections">
                {sezioneCorrente.sottosezioni.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSottosezioneAttiva(sub.id)}
                    className={`docs-subsection-btn ${sottosezioneAttiva === sub.id ? 'active' : ''}`}
                  >
                    {sub.titolo}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="docs-footer">
            <p>&copy; {new Date().getFullYear()} OmnilyPro</p>
            <p>Tutti i diritti riservati.</p>
        </div>
      </aside>

      {/* Contenuto Principale */}
      <main key={animationKey} className="docs-main">
        <div className="docs-content">
          <header className="docs-header">
             <div className="docs-header-icon">
              {sezioneCorrente.icona}
            </div>
            <div className="docs-header-text">
                <p className="docs-header-category">{sezioneCorrente.titolo}</p>
                <h2 className="docs-header-title">{sottosezioneCorrente.titolo}</h2>
            </div>
          </header>

          <p className="docs-description">
            {sottosezioneCorrente.descrizione}
          </p>

          <div className="docs-features">
            <h3>Funzionalità Chiave</h3>
            <div className="docs-features-grid">
              {sottosezioneCorrente.puntiChiave.map((punto, index) => (
                <PuntoChiaveCard key={index} text={punto} />
              ))}
            </div>
          </div>

          {/* Guida Dettagliata */}
          {sottosezioneCorrente.guida && (
            <>
              {/* Come Iniziare */}
              <div className="docs-guide-section">
                <h3 className="docs-guide-title">Come Iniziare</h3>
                <ol className="docs-steps-list">
                  {sottosezioneCorrente.guida.comeIniziare.map((passo, index) => (
                    <li key={index} className="docs-step-item">{passo}</li>
                  ))}
                </ol>
              </div>

              {/* Procedure Passo-Passo */}
              {sottosezioneCorrente.guida.procedura && sottosezioneCorrente.guida.procedura.length > 0 && (
                <div className="docs-guide-section">
                  <h3 className="docs-guide-title">Procedura Passo-Passo</h3>
                  {sottosezioneCorrente.guida.procedura.map((proc, index) => (
                    <div key={index} className="docs-procedure-block">
                      <h4 className="docs-procedure-title">{proc.titolo}</h4>
                      <ol className="docs-steps-list">
                        {proc.passi.map((passo, idx) => (
                          <li key={idx} className="docs-step-item">{passo}</li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}

              {/* Esempi Pratici */}
              {sottosezioneCorrente.guida.esempiPratici && sottosezioneCorrente.guida.esempiPratici.length > 0 && (
                <div className="docs-guide-section">
                  <h3 className="docs-guide-title">Esempi Pratici</h3>
                  <div className="docs-examples-grid">
                    {sottosezioneCorrente.guida.esempiPratici.map((esempio, index) => (
                      <div key={index} className="docs-example-card">
                        <div className="docs-example-icon">💡</div>
                        <p className="docs-example-text">{esempio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Troubleshooting */}
              {sottosezioneCorrente.guida.troubleshooting && sottosezioneCorrente.guida.troubleshooting.length > 0 && (
                <div className="docs-guide-section">
                  <h3 className="docs-guide-title">Troubleshooting</h3>
                  <div className="docs-troubleshooting-list">
                    {sottosezioneCorrente.guida.troubleshooting.map((item, index) => (
                      <div key={index} className="docs-trouble-item">
                        <div className="docs-trouble-problem">
                          <strong>❌ Problema:</strong> {item.problema}
                        </div>
                        <div className="docs-trouble-solution">
                          <strong>✅ Soluzione:</strong> {item.soluzione}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocumentationInteractive;
