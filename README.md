# Stock ChartPi 📊

**Real-time market data on your wall** - A sleek, always-on crypto and stock dashboard designed specifically for Raspberry Pi setups with external displays.

[![License: CC BY-NC-SA 4.0](https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc-sa/4.0/)

## Features

- **Professional Charts**: Candlestick and line charts powered by TradingView Lightweight Charts
- **Cryptocurrency Data**: Real-time data from Binance (1000+ pairs, no API key required)
- **Stock Data**: Historical OHLC from Yahoo Finance (global markets, no API key required)
- **Flexible Grid Layouts**: 1x1 to 8x4 configurations
- **NYSE Market Hours**: Live countdown with US holiday tracking
- **Symbol Autocomplete**: Smart search with validation for both crypto and stocks
- **Dark Theme**: Optimized for always-on displays to reduce screen burn-in
- **Raspberry Pi Optimized**: Minimal animations, efficient data fetching

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Raspberry Pi Setup

### Automated Setup (Recommended)

Run the setup script to automatically configure everything:

```bash
# Clone the repository
git clone https://github.com/yourusername/stock-chartpi.git
cd stock-chartpi

# Run the setup script
chmod +x scripts/raspberry-pi-setup.sh
./scripts/raspberry-pi-setup.sh

# Reboot to start automatically
sudo reboot
```

The setup script will:
- Install all dependencies (Node.js, npm, Chromium)
- Build the application for production
- Create a systemd service for the web server
- Configure autostart in kiosk mode
- Disable screen blanking and power management
- Hide the mouse cursor when idle

### Manual Setup

#### Build and Serve

```bash
# Build for production
npm run build

# Serve the app
npx serve dist -l 3000
```

#### Kiosk Mode

```bash
# Run Chromium in kiosk mode
chromium-browser --kiosk --disable-infobars http://localhost:3000
```

#### Auto-start on Boot

Add to `/etc/xdg/lxsession/LXDE-pi/autostart`:
```
@chromium-browser --kiosk --disable-infobars http://localhost:3000
```

#### Disable Screen Sleep

```bash
xset s off
xset -dpms
xset s noblank
```

### Useful Commands

```bash
# View server status
sudo systemctl status stock-chartpi

# Restart server
sudo systemctl restart stock-chartpi

# View server logs
journalctl -u stock-chartpi -f
```

## Data Sources

| Source | Type | API Key | Rate Limit |
|--------|------|---------|------------|
| Binance | Crypto | Not required | 1,200 req/min |
| Yahoo Finance | Stocks | Not required | Generous |

## Configuration

Click the settings icon to:
- Change grid layout (1x1, 2x2, 3x2, 4x2, 4x4, 8x4)
- Add/remove charts with autocomplete
- Configure chart type, interval, and refresh rate

## Project Structure

```
src/
├── components/     # React components
├── context/        # Global state management
├── hooks/          # Data fetching hooks
├── services/       # API clients (Binance, Yahoo Finance)
├── styles/         # CSS with dark theme
└── types/          # TypeScript definitions
```

## Tech Stack

- React 18 + TypeScript
- Vite
- TradingView Lightweight Charts
- CSS Grid + CSS Variables

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0)](https://creativecommons.org/licenses/by-nc-sa/4.0/).

**You are free to:**
- Share and adapt the material for non-commercial purposes
- Must give appropriate credit and indicate changes

**You may not:**
- Use the material for commercial purposes

For commercial licensing inquiries, please visit [day0ops.com](https://day0ops.com).

## Author

Created by [day0ops.com](https://day0ops.com)
