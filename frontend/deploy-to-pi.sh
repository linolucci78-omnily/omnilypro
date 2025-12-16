#!/bin/bash

##############################################################################
# OmnilyPro - Deploy to Raspberry Pi
#
# Questo script:
# 1. Scarica l'ultima release da GitHub
# 2. La copia sul Raspberry Pi
# 3. Abilita il servizio e riavvia
#
# Uso:
#   ./deploy-to-pi.sh 192.168.1.237
##############################################################################

set -e

# Colori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PI_IP="${1:-192.168.1.237}"
PI_USER="${2:-pi}"

echo -e "${BLUE}"
cat << "EOF"
   ___            _ _       ___
  / _ \ _ __ ___ (_) |_   _|  _ \ _ __  ___
 | | | | '_ ` _ \| | | | | | |_) | '__|/ _ \
 | |_| | | | | | | | | |_| |  __/| |  | (_) |
  \___/|_| |_| |_|_|_|\__, |_|   |_|   \___/
                      |___/
       Digital Signage - Deploy to Raspberry Pi
EOF
echo -e "${NC}"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment to Raspberry Pi${NC}"
echo -e "${GREEN}================================${NC}\n"

# Step 1: Download latest release from GitHub
echo -e "${BLUE}📥 Step 1/4: Downloading latest release from GitHub...${NC}"
LATEST_RELEASE=$(curl -s https://api.github.com/repos/linolucci78-omnily/omnilypro/releases/latest)
DOWNLOAD_URL=$(echo "$LATEST_RELEASE" | grep "browser_download_url.*omnilypro-signage" | grep -v ".sig" | cut -d '"' -f 4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo -e "${RED}❌ Error: No release found on GitHub!${NC}"
    echo -e "${YELLOW}💡 Make sure you have created a release with tag v1.0.0${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found release: $DOWNLOAD_URL${NC}\n"

# Download the binary
echo -e "${BLUE}📦 Downloading binary...${NC}"
curl -L "$DOWNLOAD_URL" -o /tmp/omnilypro-signage
chmod +x /tmp/omnilypro-signage

# Step 2: Copy to Raspberry Pi
echo -e "\n${BLUE}📤 Step 2/4: Copying to Raspberry Pi ($PI_IP)...${NC}"
scp /tmp/omnilypro-signage ${PI_USER}@${PI_IP}:/tmp/

# Step 3: Install on Raspberry Pi
echo -e "\n${BLUE}🔧 Step 3/4: Installing on Raspberry Pi...${NC}"
ssh ${PI_USER}@${PI_IP} << 'ENDSSH'
sudo mv /tmp/omnilypro-signage /opt/omnilypro/
sudo chmod +x /opt/omnilypro/omnilypro-signage
sudo chown root:root /opt/omnilypro/omnilypro-signage
ENDSSH

# Step 4: Enable service and reboot
echo -e "\n${BLUE}🚀 Step 4/4: Enabling service...${NC}"
ssh ${PI_USER}@${PI_IP} << 'ENDSSH'
sudo systemctl enable omnilypro-signage
sudo systemctl daemon-reload
ENDSSH

echo -e "\n${GREEN}✅ Deployment completed!${NC}\n"
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo -e "${YELLOW}================================================${NC}"
echo -e "${YELLOW}Reboot the Raspberry Pi to start the app:${NC}"
echo -e "   ${BLUE}ssh ${PI_USER}@${PI_IP} 'sudo reboot'${NC}"
echo -e ""
echo -e "${YELLOW}Or start the service without reboot:${NC}"
echo -e "   ${BLUE}ssh ${PI_USER}@${PI_IP} 'sudo systemctl start omnilypro-signage'${NC}"
echo -e ""
echo -e "${YELLOW}Check logs:${NC}"
echo -e "   ${BLUE}ssh ${PI_USER}@${PI_IP} 'sudo journalctl -u omnilypro-signage -f'${NC}"
echo -e "${YELLOW}================================================${NC}\n"

# Clean up
rm -f /tmp/omnilypro-signage
