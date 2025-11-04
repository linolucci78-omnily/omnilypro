#!/bin/bash
echo "Per verificare se l'app Android ha salvato correttamente il device_id:"
echo ""
echo "Sul POS, dopo aver scansionato il QR:"
echo "1. Collega il POS al computer via USB"
echo "2. Abilita USB debugging"
echo "3. Esegui: adb logcat | grep 'device_id'"
echo ""
echo "Oppure apri l'app e guarda i log in /storage/emulated/0/OmnilyPOS/provisioning_log.txt"
