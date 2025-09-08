// Lightweight timezone helpers using Intl without adding deps

type DateParts = {
  year: number;
  month: number; // 1-12
  day: number;   // 1-31
  hour: number;  // 0-23
  minute: number;// 0-59
  second: number;// 0-59
};

function formatToParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

// Returns timezone offset in minutes (UTC - local) at the provided UTC date
export function getTimeZoneOffsetMinutes(dateUtc: Date, timeZone: string): number {
  const parts = formatToParts(dateUtc, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const diffMs = asUtc - dateUtc.getTime();
  return Math.round(diffMs / 60000);
}

// Build a UTC Date representing the provided local time components in a timeZone
export function zonedTimeToUtc(year: number, month1: number, day: number, hour: number, minute: number, timeZone: string): Date {
  // Start with the intended UTC time, then adjust by the tz offset at that instant
  const guess = new Date(Date.UTC(year, month1 - 1, day, hour, minute, 0));
  const offsetMin = getTimeZoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offsetMin * 60000);
}

// Convenience function that takes a Date object and timezone
export function zonedTimeToUtcFromDate(date: Date, timeZone: string): Date {
  const parts = formatToParts(date, timeZone);
  return zonedTimeToUtc(parts.year, parts.month, parts.day, parts.hour, parts.minute, timeZone);
}

// Extract local Y/M/D for a given UTC date in a timeZone
export function getLocalYmd(dateUtc: Date, timeZone: string): { year: number; month: number; day: number } {
  const p = formatToParts(dateUtc, timeZone);
  return { year: p.year, month: p.month, day: p.day };
}

