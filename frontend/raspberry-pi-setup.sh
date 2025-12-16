#!/bin/bash

##############################################################################
# OmnilyPro Digital Signage - Raspberry Pi Setup Script
#
# Questo script installa e configura Raspberry Pi OS Lite per eseguire
# l'app OmnilyPro Digital Signage in modalità kiosk.
#
# Requisiti:
# - Raspberry Pi 4 (2GB RAM o superiore)
# - Raspberry Pi OS Lite 64-bit
# - Connessione internet
#
# Uso:
#   curl -sSL https://raw.githubusercontent.com/TUOUSERNAME/TUOREPO/main/raspberry-pi-setup.sh | bash
#
#   OPPURE
#
#   wget -O - https://raw.githubusercontent.com/TUOUSERNAME/TUOREPO/main/raspberry-pi-setup.sh | bash
##############################################################################

set -e  # Exit on error

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
cat << "EOF"
   ___            _ _       ___
  / _ \ _ __ ___ (_) |_   _|  _ \ _ __  ___
 | | | | '_ ` _ \| | | | | | |_) | '__|/ _ \
 | |_| | | | | | | | | |_| |  __/| |  | (_) |
  \___/|_| |_| |_|_|_|\__, |_|   |_|   \___/
                      |___/
       Digital Signage - Raspberry Pi Setup
EOF
echo -e "${NC}"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Starting OmnilyPro Installation${NC}"
echo -e "${GREEN}================================${NC}\n"

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo && ! grep -q "BCM" /proc/cpuinfo; then
    echo -e "${RED}❌ Error: This script must be run on a Raspberry Pi!${NC}"
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}⚠️  This script requires root privileges.${NC}"
    echo -e "${YELLOW}   Please run with sudo:${NC}"
    echo -e "${YELLOW}   sudo bash $0${NC}\n"
    exit 1
fi

echo -e "${BLUE}📦 Step 1/7: Updating system...${NC}"
apt-get update
apt-get upgrade -y

echo -e "\n${BLUE}📦 Step 2/7: Installing Xorg and dependencies...${NC}"
apt-get install -y \
    xorg \
    openbox \
    xserver-xorg-video-fbdev \
    libwebkit2gtk-4.1-0 \
    libjavascriptcoregtk-4.1-0 \
    libgtk-3-0 \
    libayatana-appindicator3-1 \
    unclutter \
    x11-xserver-utils

echo -e "\n${BLUE}📂 Step 3/7: Creating application directory...${NC}"
mkdir -p /opt/omnilypro
chown -R $SUDO_USER:$SUDO_USER /opt/omnilypro

echo -e "\n${BLUE}⚙️  Step 4/7: Creating systemd service...${NC}"
cat > /etc/systemd/system/omnilypro-signage.service << 'SERVICEEOF'
[Unit]
Description=OmnilyPro Digital Signage
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
WorkingDirectory=/opt/omnilypro
ExecStart=/opt/omnilypro/omnilypro-signage
Restart=always
RestartSec=10

[Install]
WantedBy=graphical.target
SERVICEEOF

echo -e "\n${BLUE}🔧 Step 5/7: Configuring autologin...${NC}"
systemctl set-default graphical.target

# Configure autologin for user pi
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat > /etc/systemd/system/getty@tty1.service.d/autologin.conf << 'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin pi --noclear %I $TERM
EOF

echo -e "\n${BLUE}🖥️  Step 6/7: Configuring Xorg autostart...${NC}"
# Create .xinitrc for automatic X start
cat > /home/pi/.xinitrc << 'EOF'
#!/bin/bash

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor
unclutter -idle 0.1 -root &

# Start openbox window manager
exec openbox-session
EOF

chown pi:pi /home/pi/.xinitrc
chmod +x /home/pi/.xinitrc

# Auto-start X on login
cat >> /home/pi/.bash_profile << 'EOF'

# Auto-start X
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
    exec startx
fi
EOF

chown pi:pi /home/pi/.bash_profile

echo -e "\n${BLUE}🎨 Step 7/7: Configuring Openbox...${NC}"
mkdir -p /home/pi/.config/openbox
cat > /home/pi/.config/openbox/autostart << 'EOF'
# Disable screen blanking
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor
unclutter -idle 0.1 -root &

# Wait a moment for system to stabilize
sleep 2

# Start OmnilyPro Digital Signage
/opt/omnilypro/omnilypro-signage &
EOF

chown -R pi:pi /home/pi/.config

echo -e "\n${GREEN}✅ Installation completed!${NC}\n"
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}1. Copy your OmnilyPro app to:${NC}"
echo -e "   ${BLUE}/opt/omnilypro/omnilypro-signage${NC}"
echo -e ""
echo -e "${YELLOW}2. Make it executable:${NC}"
echo -e "   ${BLUE}sudo chmod +x /opt/omnilypro/omnilypro-signage${NC}"
echo -e ""
echo -e "${YELLOW}3. Enable the service:${NC}"
echo -e "   ${BLUE}sudo systemctl enable omnilypro-signage${NC}"
echo -e ""
echo -e "${YELLOW}4. Reboot:${NC}"
echo -e "   ${BLUE}sudo reboot${NC}"
echo -e ""
echo -e "${GREEN}After reboot, the app will start automatically!${NC}"
echo -e "${YELLOW}================================================${NC}\n"
