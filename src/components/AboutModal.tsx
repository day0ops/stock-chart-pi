import { useState } from 'react';
import { Logo } from './Logo';
import { APP_NAME, APP_VERSION, AUTHOR_URL, LICENSE_URL, LICENSE_NAME } from '../version';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <button className="about-close" onClick={onClose}>
          &times;
        </button>

        <div className="about-header">
          <div className="about-logo">
            <Logo size={48} className="logo-icon" />
            <div className="logo-text-group">
              <span className="logo-text">{APP_NAME}</span>
              <span className="logo-version">v{APP_VERSION}</span>
            </div>
          </div>
          <span className="about-tagline">Real-time market data on your wall</span>
        </div>

        <div className="about-content">
          <section className="about-section">
            <h3>What is {APP_NAME}?</h3>
            <p>
              {APP_NAME} is a sleek, always-on market dashboard designed to display live
              cryptocurrency and stock charts. Perfect for traders, investors, or anyone
              who wants to keep an eye on the markets.
            </p>
          </section>

          <section className="about-section">
            <h3>Optimized for Raspberry Pi</h3>
            <p>
              Built specifically for Raspberry Pi setups with external displays (15.6" and up).
              Features a dark theme to reduce screen burn-in, minimal animations for smooth
              performance, and efficient data fetching to respect API limits.
            </p>
            <div className="about-tip">
              <span className="tip-icon">💡</span>
              <span>Run in Chromium kiosk mode for the best experience</span>
            </div>
          </section>

          <section className="about-section">
            <h3>Features</h3>
            <ul className="feature-list">
              <li>
                <span className="feature-icon">📈</span>
                <span>Professional candlestick & line charts</span>
              </li>
              <li>
                <span className="feature-icon">🪙</span>
                <span>Crypto data from Binance (1000+ pairs)</span>
              </li>
              <li>
                <span className="feature-icon">📊</span>
                <span>Stock data from Yahoo Finance (global markets)</span>
              </li>
              <li>
                <span className="feature-icon">🔑</span>
                <span>No API keys required - completely free</span>
              </li>
              <li>
                <span className="feature-icon">⚡</span>
                <span>Configurable grid layouts (1x1 to 8x4)</span>
              </li>
              <li>
                <span className="feature-icon">🕐</span>
                <span>NYSE market hours & holiday tracking</span>
              </li>
              <li>
                <span className="feature-icon">🌙</span>
                <span>Dark theme optimized for always-on displays</span>
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h3>Quick Setup for Raspberry Pi</h3>
            <div className="code-block">
              <code>
                # Build for production{'\n'}
                npm run build{'\n'}
                {'\n'}
                # Serve the app{'\n'}
                npx serve dist -l 3000{'\n'}
                {'\n'}
                # Run in kiosk mode{'\n'}
                chromium-browser --kiosk http://localhost:3000
              </code>
            </div>
          </section>
        </div>

        <div className="about-footer">
          <div className="footer-links">
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              day0ops.com
            </a>
            <span className="separator">•</span>
            <a
              href={LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link license-link"
            >
              {LICENSE_NAME}
            </a>
          </div>
          <div className="footer-meta">
            <span className="version">v{APP_VERSION}</span>
            <span className="separator">•</span>
            <span className="tech-stack">React + TradingView Charts</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing about modal state
export function useAboutModal() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
