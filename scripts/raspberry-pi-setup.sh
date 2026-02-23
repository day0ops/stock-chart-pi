#!/bin/bash

# Stock ChartPi - Raspberry Pi Auto-Start Setup Script
# This script configures your Raspberry Pi to automatically start
# Stock ChartPi in fullscreen kiosk mode on boot.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           Stock ChartPi - Raspberry Pi Setup              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
APP_DIR="${APP_DIR:-$(pwd)}"
APP_PORT="${APP_PORT:-3000}"
APP_URL="http://localhost:${APP_PORT}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  App Directory: ${APP_DIR}"
echo "  App Port: ${APP_PORT}"
echo "  App URL: ${APP_URL}"
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo -e "${YELLOW}Warning: This doesn't appear to be a Raspberry Pi.${NC}"
    echo "The script will continue, but some features may not work."
    echo ""
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Install dependencies
echo -e "${GREEN}Step 1: Checking dependencies...${NC}"

if ! command_exists node; then
    echo "Node.js is not installed. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

if ! command_exists npm; then
    echo "npm is not installed. Installing..."
    sudo apt-get install -y npm
fi

if ! command_exists chromium-browser && ! command_exists chromium; then
    echo "Chromium is not installed. Installing..."
    sudo apt-get install -y chromium-browser
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 2: Build the application
echo -e "${GREEN}Step 2: Building Stock ChartPi...${NC}"
cd "${APP_DIR}"

if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
fi

echo "Building for production..."
npm run build

echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 3: Install serve globally
echo -e "${GREEN}Step 3: Installing serve...${NC}"
if ! command_exists serve; then
    sudo npm install -g serve
fi
echo -e "${GREEN}✓ Serve installed${NC}"
echo ""

# Step 4: Create systemd service for the web server
echo -e "${GREEN}Step 4: Creating systemd service...${NC}"

SERVICE_FILE="/etc/systemd/system/stock-chartpi.service"
sudo tee ${SERVICE_FILE} > /dev/null << EOF
[Unit]
Description=Stock ChartPi Web Server
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/npx serve dist -l ${APP_PORT}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable stock-chartpi.service
sudo systemctl start stock-chartpi.service

echo -e "${GREEN}✓ Systemd service created and started${NC}"
echo ""

# Step 5: Create kiosk autostart script
echo -e "${GREEN}Step 5: Setting up kiosk mode autostart...${NC}"

# Create autostart directory if it doesn't exist
mkdir -p ~/.config/autostart

# Create desktop entry for autostart
AUTOSTART_FILE=~/.config/autostart/stock-chartpi-kiosk.desktop
cat > ${AUTOSTART_FILE} << EOF
[Desktop Entry]
Type=Application
Name=Stock ChartPi Kiosk
Exec=${APP_DIR}/scripts/start-kiosk.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF

# Create the kiosk startup script
KIOSK_SCRIPT="${APP_DIR}/scripts/start-kiosk.sh"
cat > ${KIOSK_SCRIPT} << EOF
#!/bin/bash

# Stock ChartPi Kiosk Mode Startup Script
# Waits for the web server and launches Chromium in kiosk mode

APP_URL="${APP_URL}"
MAX_WAIT=60

# Disable screen blanking and power management
xset s off
xset -dpms
xset s noblank

# Hide mouse cursor after 3 seconds of inactivity
if command -v unclutter &> /dev/null; then
    unclutter -idle 3 &
fi

# Wait for the web server to be ready
echo "Waiting for Stock ChartPi server..."
COUNTER=0
while ! curl -s "\${APP_URL}" > /dev/null; do
    sleep 1
    COUNTER=\$((COUNTER + 1))
    if [ \$COUNTER -ge \$MAX_WAIT ]; then
        echo "Timeout waiting for server"
        exit 1
    fi
done

echo "Server is ready. Starting kiosk mode..."

# Detect which chromium command is available
if command -v chromium-browser &> /dev/null; then
    CHROMIUM_CMD="chromium-browser"
elif command -v chromium &> /dev/null; then
    CHROMIUM_CMD="chromium"
else
    echo "Chromium not found!"
    exit 1
fi

# Launch Chromium in kiosk mode
\${CHROMIUM_CMD} \\
    --kiosk \\
    --noerrdialogs \\
    --disable-infobars \\
    --disable-session-crashed-bubble \\
    --disable-restore-session-state \\
    --disable-component-update \\
    --check-for-update-interval=31536000 \\
    --disable-features=TranslateUI \\
    --no-first-run \\
    --start-fullscreen \\
    --autoplay-policy=no-user-gesture-required \\
    "\${APP_URL}"
EOF

chmod +x ${KIOSK_SCRIPT}

echo -e "${GREEN}✓ Kiosk autostart configured${NC}"
echo ""

# Step 6: Install unclutter for hiding mouse cursor (optional)
echo -e "${GREEN}Step 6: Installing unclutter (hides mouse cursor)...${NC}"
if ! command_exists unclutter; then
    sudo apt-get install -y unclutter
fi
echo -e "${GREEN}✓ Unclutter installed${NC}"
echo ""

# Step 7: Configure display settings
echo -e "${GREEN}Step 7: Configuring display settings...${NC}"

# Create a script to disable screen blanking on boot
XSESSION_FILE=~/.xsessionrc
if [ ! -f ${XSESSION_FILE} ] || ! grep -q "Stock ChartPi" ${XSESSION_FILE}; then
    cat >> ${XSESSION_FILE} << EOF

# Stock ChartPi - Disable screen blanking
xset s off
xset -dpms
xset s noblank
EOF
fi

echo -e "${GREEN}✓ Display settings configured${NC}"
echo ""

# Summary
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo "Stock ChartPi is now configured to:"
echo "  1. Start the web server automatically on boot"
echo "  2. Launch Chromium in fullscreen kiosk mode"
echo "  3. Disable screen blanking and power management"
echo "  4. Hide the mouse cursor when idle"
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View server status:    sudo systemctl status stock-chartpi"
echo "  Restart server:        sudo systemctl restart stock-chartpi"
echo "  View server logs:      journalctl -u stock-chartpi -f"
echo "  Start kiosk manually:  ${KIOSK_SCRIPT}"
echo ""
echo -e "${YELLOW}To start immediately without rebooting:${NC}"
echo "  ${KIOSK_SCRIPT}"
echo ""
echo -e "${GREEN}Reboot your Raspberry Pi to start Stock ChartPi automatically!${NC}"
echo "  sudo reboot"
echo ""
