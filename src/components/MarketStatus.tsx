import { useState, useEffect } from 'react';
import {
  getMarketStatus,
  formatCountdown,
  formatTimeET,
  formatTimeLocal,
  getUserTimezone,
} from '../services/marketHours';
import type { MarketStatus as MarketStatusType } from '../services/marketHours';

export function MarketStatus() {
  const [status, setStatus] = useState<MarketStatusType | null>(null);
  const [expanded, setExpanded] = useState(false);

  // Update status every second
  useEffect(() => {
    const updateStatus = () => {
      setStatus(getMarketStatus());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const getSessionLabel = () => {
    switch (status.session) {
      case 'pre-market':
        return 'Pre-Market';
      case 'regular':
        return 'Market Open';
      case 'after-hours':
        return 'After Hours';
      case 'closed':
        return 'Market Closed';
    }
  };

  const getSessionClass = () => {
    switch (status.session) {
      case 'regular':
        return 'open';
      case 'pre-market':
      case 'after-hours':
        return 'extended';
      case 'closed':
        return 'closed';
    }
  };

  const getNextEventLabel = () => {
    switch (status.nextEvent) {
      case 'open':
        return 'Opens in';
      case 'close':
        return 'Closes in';
      case 'pre-market':
        return 'Pre-market in';
      case 'after-hours-end':
        return 'After-hours ends in';
    }
  };

  const userTz = getUserTimezone();
  const localTzAbbr = new Date()
    .toLocaleTimeString('en-US', { timeZoneName: 'short' })
    .split(' ')
    .pop();

  return (
    <div className={`market-status ${getSessionClass()}`}>
      <div className="market-status-main" onClick={() => setExpanded(!expanded)}>
        <div className="market-status-indicator">
          <span className={`status-dot ${getSessionClass()}`} />
          <span className="status-label">{getSessionLabel()}</span>
        </div>

        <div className="market-countdown">
          <span className="countdown-label">{getNextEventLabel()}</span>
          <span className="countdown-time">{formatCountdown(status.countdownMs)}</span>
        </div>

        <button
          className="market-expand-btn"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <path d="M7 10l5 5 5-5z" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="market-status-details">
          {status.isHoliday && (
            <div className="market-holiday-notice">
              <span className="holiday-icon">🏛️</span>
              <span>Closed for {status.holidayName}</span>
            </div>
          )}

          {status.isEarlyClose && !status.isHoliday && (
            <div className="market-early-close-notice">
              <span className="early-icon">⏰</span>
              <span>Early close today at 1:00 PM ET</span>
            </div>
          )}

          <div className="market-hours-grid">
            <div className="market-hours-section">
              <h4>NYSE Hours (Eastern Time)</h4>
              <div className="hours-row">
                <span className="hours-label">Pre-Market:</span>
                <span className="hours-value">4:00 AM - 9:30 AM</span>
              </div>
              <div className="hours-row">
                <span className="hours-label">Regular:</span>
                <span className="hours-value">9:30 AM - {status.isEarlyClose ? '1:00 PM' : '4:00 PM'}</span>
              </div>
              <div className="hours-row">
                <span className="hours-label">After-Hours:</span>
                <span className="hours-value">{status.isEarlyClose ? 'Closed' : '4:00 PM - 8:00 PM'}</span>
              </div>
            </div>

            <div className="market-hours-section">
              <h4>Your Time ({localTzAbbr})</h4>
              <div className="hours-row">
                <span className="hours-label">Current ET:</span>
                <span className="hours-value">{formatTimeET(status.currentTimeET)} ET</span>
              </div>
              <div className="hours-row">
                <span className="hours-label">Next Event:</span>
                <span className="hours-value">{formatTimeLocal(status.nextEventTimeLocal)}</span>
              </div>
              <div className="hours-row timezone-row">
                <span className="hours-label">Timezone:</span>
                <span className="hours-value">{userTz}</span>
              </div>
            </div>
          </div>

          <div className="market-sessions-visual">
            <div className="session-bar">
              <div className="session-segment closed" style={{ width: '16.67%' }} title="Closed (12AM-4AM)">
                <span>Closed</span>
              </div>
              <div className="session-segment pre-market" style={{ width: '22.92%' }} title="Pre-Market (4AM-9:30AM)">
                <span>Pre</span>
              </div>
              <div className="session-segment regular" style={{ width: '27.08%' }} title="Regular (9:30AM-4PM)">
                <span>Regular</span>
              </div>
              <div className="session-segment after-hours" style={{ width: '16.67%' }} title="After-Hours (4PM-8PM)">
                <span>After</span>
              </div>
              <div className="session-segment closed" style={{ width: '16.67%' }} title="Closed (8PM-12AM)">
                <span>Closed</span>
              </div>
            </div>
            <div className="session-times">
              <span>12AM</span>
              <span>4AM</span>
              <span>9:30AM</span>
              <span>4PM</span>
              <span>8PM</span>
              <span>12AM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
