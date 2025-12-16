# 🍓 OmnilyPro Digital Signage - Raspberry Pi Setup Guide

Questa guida ti spiega **passo-passo** come installare l'app OmnilyPro Digital Signage su Raspberry Pi OS Lite.

---

## 📋 Prerequisiti

- **Hardware**: Raspberry Pi 4 (2GB RAM o superiore)
- **MicroSD**: 16GB o superiore (classe 10)
- **SO**: Raspberry Pi OS Lite 64-bit
- **Rete**: Connessione internet (WiFi o Ethernet)

---

## 🚀 Installazione Rapida

Esegui questo comando sul Raspberry Pi:

```bash
sudo bash -c "$(curl -sSL https://raw.githubusercontent.com/TUOUSERNAME/TUOREPO/main/raspberry-pi-setup.sh)"
```

---

## 📝 Guida Passo-Passo

### **PASSO 1: Preparare la MicroSD**

1. Scarica **Raspberry Pi Imager** da https://www.raspberrypi.com/software/
2. Scegli **Raspberry Pi OS Lite (64-bit)**
3. Configura (⚙️):
   - ✅ SSH attivo
   - ✅ Username: `pi`
   - ✅ Password sicura
   - ✅ WiFi (se serve)
4. Scrivi su microSD

### **PASSO 2: Avvia e Connetti**

```bash
ssh pi@raspberrypi.local
```

### **PASSO 3: Installa**

```bash
sudo bash -c "$(curl -sSL https://... /raspberry-pi-setup.sh)"
```

### **PASSO 4: Copia App**

```bash
# Sul Mac, compila per ARM64
npm run tauri build -- --target aarch64-unknown-linux-gnu

# Copia sul Raspberry
scp src-tauri/target/aarch64-unknown-linux-gnu/release/omnilypro-signage pi@raspberrypi.local:/tmp/
ssh pi@raspberrypi.local "sudo mv /tmp/omnilypro-signage /opt/omnilypro/ && sudo chmod +x /opt/omnilypro/omnilypro-signage"
```

### **PASSO 5: Abilita Servizio**

```bash
sudo systemctl enable omnilypro-signage
sudo reboot
```

---

## ✅ Risultato

Dopo il riavvio:
1. ⏱️ Boot in 15-20 secondi
2. 🌟 Splash screen (7 secondi)
3. 📱 Pairing page con PIN

---

## 🔧 Comandi Utili

```bash
# Log in tempo reale
sudo journalctl -u omnilypro-signage -f

# Riavvia app
sudo systemctl restart omnilypro-signage

# Status
sudo systemctl status omnilypro-signage
```

---

## 🔄 Aggiornamenti

L'app si aggiorna **automaticamente ogni 6 ore** da GitHub!

---

**Fatto con ❤️ da OmnilyPro**
