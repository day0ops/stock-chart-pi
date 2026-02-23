// NYSE Market Hours Service
// NYSE operates 9:30 AM - 4:00 PM Eastern Time (ET)
// Pre-market: 4:00 AM - 9:30 AM ET
// After-hours: 4:00 PM - 8:00 PM ET

// US Market Holidays (NYSE closed) - 2024, 2025, 2026
// Source: NYSE holiday schedule
const MARKET_HOLIDAYS: Record<number, string[]> = {
  2024: [
    '2024-01-01', // New Year's Day
    '2024-01-15', // Martin Luther King Jr. Day
    '2024-02-19', // Presidents' Day
    '2024-03-29', // Good Friday
    '2024-05-27', // Memorial Day
    '2024-06-19', // Juneteenth
    '2024-07-04', // Independence Day
    '2024-09-02', // Labor Day
    '2024-11-28', // Thanksgiving Day
    '2024-12-25', // Christmas Day
  ],
  2025: [
    '2025-01-01', // New Year's Day
    '2025-01-20', // Martin Luther King Jr. Day
    '2025-02-17', // Presidents' Day
    '2025-04-18', // Good Friday
    '2025-05-26', // Memorial Day
    '2025-06-19', // Juneteenth
    '2025-07-04', // Independence Day
    '2025-09-01', // Labor Day
    '2025-11-27', // Thanksgiving Day
    '2025-12-25', // Christmas Day
  ],
  2026: [
    '2026-01-01', // New Year's Day
    '2026-01-19', // Martin Luther King Jr. Day
    '2026-02-16', // Presidents' Day
    '2026-04-03', // Good Friday
    '2026-05-25', // Memorial Day
    '2026-06-19', // Juneteenth
    '2026-07-03', // Independence Day (observed)
    '2026-09-07', // Labor Day
    '2026-11-26', // Thanksgiving Day
    '2026-12-25', // Christmas Day
  ],
};

// Early close days (1:00 PM ET) - day before Independence Day, day after Thanksgiving, Christmas Eve
const EARLY_CLOSE_DAYS: Record<number, string[]> = {
  2024: [
    '2024-07-03', // Day before Independence Day
    '2024-11-29', // Day after Thanksgiving
    '2024-12-24', // Christmas Eve
  ],
  2025: [
    '2025-07-03', // Day before Independence Day
    '2025-11-28', // Day after Thanksgiving
    '2025-12-24', // Christmas Eve
  ],
  2026: [
    '2026-07-02', // Day before Independence Day (observed on 3rd)
    '2026-11-27', // Day after Thanksgiving
    '2026-12-24', // Christmas Eve
  ],
};

export type MarketSession = 'pre-market' | 'regular' | 'after-hours' | 'closed';

export interface MarketStatus {
  isOpen: boolean;
  session: MarketSession;
  currentTimeET: Date;
  nextEvent: 'open' | 'close' | 'pre-market' | 'after-hours-end';
  nextEventTime: Date;
  nextEventTimeLocal: Date;
  countdownMs: number;
  isHoliday: boolean;
  holidayName?: string;
  isEarlyClose: boolean;
  regularOpenET: string;
  regularCloseET: string;
}

// Convert any date to Eastern Time
function toEasternTime(date: Date): Date {
  const etString = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
  return new Date(etString);
}

// Get date string in YYYY-MM-DD format for ET
function getETDateString(date: Date): string {
  const et = toEasternTime(date);
  const year = et.getFullYear();
  const month = String(et.getMonth() + 1).padStart(2, '0');
  const day = String(et.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if a date is a weekend
function isWeekend(date: Date): boolean {
  const et = toEasternTime(date);
  const day = et.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Check if a date is a market holiday
function isMarketHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const dateStr = getETDateString(date);
  const year = new Date(dateStr).getFullYear();
  const holidays = MARKET_HOLIDAYS[year] || [];

  const holidayNames: Record<string, string> = {
    '01-01': "New Year's Day",
    '01-15': 'Martin Luther King Jr. Day',
    '01-19': 'Martin Luther King Jr. Day',
    '01-20': 'Martin Luther King Jr. Day',
    '02-16': "Presidents' Day",
    '02-17': "Presidents' Day",
    '02-19': "Presidents' Day",
    '03-29': 'Good Friday',
    '04-03': 'Good Friday',
    '04-18': 'Good Friday',
    '05-25': 'Memorial Day',
    '05-26': 'Memorial Day',
    '05-27': 'Memorial Day',
    '06-19': 'Juneteenth',
    '07-03': 'Independence Day',
    '07-04': 'Independence Day',
    '09-01': 'Labor Day',
    '09-02': 'Labor Day',
    '09-07': 'Labor Day',
    '11-26': 'Thanksgiving Day',
    '11-27': 'Thanksgiving Day',
    '11-28': 'Thanksgiving Day',
    '12-25': 'Christmas Day',
  };

  if (holidays.includes(dateStr)) {
    const monthDay = dateStr.slice(5);
    return { isHoliday: true, name: holidayNames[monthDay] || 'Market Holiday' };
  }
  return { isHoliday: false };
}

// Check if today is an early close day
function isEarlyCloseDay(date: Date): boolean {
  const dateStr = getETDateString(date);
  const year = new Date(dateStr).getFullYear();
  const earlyDays = EARLY_CLOSE_DAYS[year] || [];
  return earlyDays.includes(dateStr);
}

// Get next trading day
function getNextTradingDay(fromDate: Date): Date {
  const next = new Date(fromDate);
  next.setDate(next.getDate() + 1);

  // Keep advancing until we find a trading day
  while (isWeekend(next) || isMarketHoliday(next).isHoliday) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

// Create a date in ET timezone and convert to local time
function createETDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  // Calculate offset between local time and ET
  const nowLocal = new Date();
  const nowET = new Date(nowLocal.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const offsetMs = nowLocal.getTime() - nowET.getTime();

  // Create the target time in ET, then adjust to local
  const targetET = new Date(year, month, day, hour, minute, 0, 0);
  return new Date(targetET.getTime() + offsetMs);
}

// Main function to get current market status
export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const nowET = toEasternTime(now);

  const etYear = nowET.getFullYear();
  const etMonth = nowET.getMonth();
  const etDay = nowET.getDate();
  const etHour = nowET.getHours();
  const etMinute = nowET.getMinutes();
  const etTimeMinutes = etHour * 60 + etMinute;

  // Market times in minutes from midnight ET
  const preMarketOpen = 4 * 60; // 4:00 AM
  const regularOpen = 9 * 60 + 30; // 9:30 AM
  const regularClose = 16 * 60; // 4:00 PM
  const earlyClose = 13 * 60; // 1:00 PM
  const afterHoursEnd = 20 * 60; // 8:00 PM

  const isEarlyClose = isEarlyCloseDay(now);
  const closeTime = isEarlyClose ? earlyClose : regularClose;
  const holidayInfo = isMarketHoliday(now);
  const weekend = isWeekend(now);

  let session: MarketSession;
  let isOpen = false;
  let nextEvent: MarketStatus['nextEvent'];
  let nextEventTime: Date;

  // Determine current session
  if (weekend || holidayInfo.isHoliday) {
    session = 'closed';
    nextEvent = 'pre-market';
    const nextTradingDay = getNextTradingDay(now);
    const ntdET = toEasternTime(nextTradingDay);
    nextEventTime = createETDate(ntdET.getFullYear(), ntdET.getMonth(), ntdET.getDate(), 4, 0);
  } else if (etTimeMinutes < preMarketOpen) {
    // Before pre-market
    session = 'closed';
    nextEvent = 'pre-market';
    nextEventTime = createETDate(etYear, etMonth, etDay, 4, 0);
  } else if (etTimeMinutes < regularOpen) {
    // Pre-market session
    session = 'pre-market';
    nextEvent = 'open';
    nextEventTime = createETDate(etYear, etMonth, etDay, 9, 30);
  } else if (etTimeMinutes < closeTime) {
    // Regular trading hours
    session = 'regular';
    isOpen = true;
    nextEvent = 'close';
    if (isEarlyClose) {
      nextEventTime = createETDate(etYear, etMonth, etDay, 13, 0);
    } else {
      nextEventTime = createETDate(etYear, etMonth, etDay, 16, 0);
    }
  } else if (etTimeMinutes < afterHoursEnd && !isEarlyClose) {
    // After-hours session
    session = 'after-hours';
    nextEvent = 'after-hours-end';
    nextEventTime = createETDate(etYear, etMonth, etDay, 20, 0);
  } else {
    // Market closed for the day
    session = 'closed';
    nextEvent = 'pre-market';
    const nextTradingDay = getNextTradingDay(now);
    const ntdET = toEasternTime(nextTradingDay);
    nextEventTime = createETDate(ntdET.getFullYear(), ntdET.getMonth(), ntdET.getDate(), 4, 0);
  }

  const countdownMs = Math.max(0, nextEventTime.getTime() - now.getTime());

  return {
    isOpen,
    session,
    currentTimeET: nowET,
    nextEvent,
    nextEventTime,
    nextEventTimeLocal: nextEventTime,
    countdownMs,
    isHoliday: holidayInfo.isHoliday,
    holidayName: holidayInfo.name,
    isEarlyClose,
    regularOpenET: '9:30 AM',
    regularCloseET: isEarlyClose ? '1:00 PM' : '4:00 PM',
  };
}

// Format countdown to human readable
export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ${String(minutes).padStart(2, '0')}m`;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Format time for display
export function formatTimeET(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get user's timezone abbreviation
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Format time in user's local timezone
export function formatTimeLocal(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
