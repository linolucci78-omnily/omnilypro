#!/bin/bash

echo "🔧 Script per disinstallare OMNILY Bridge POS"
echo "=============================================="
echo ""

# Nome package dell'app
PACKAGE="com.omnilypro.pos"

echo "1. Controllo se il dispositivo è connesso..."
adb devices

echo ""
echo "2. Verifico se l'app è Device Owner..."
adb shell dpm list-owners

echo ""
echo "3. Rimuovo privilegi Device Owner (se presenti)..."
adb shell dpm remove-active-admin com.omnilypro.pos/.mdm.MyDeviceAdminReceiver

echo ""
echo "4. Disinstallo l'app..."
adb uninstall $PACKAGE

echo ""
echo "✅ Fatto! L'app dovrebbe essere stata rimossa."
echo ""
echo "Se ancora non funziona, prova:"
echo "  adb shell pm uninstall --user 0 $PACKAGE"
