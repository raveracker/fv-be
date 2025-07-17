type RelativeUnit =
  | 'second'
  | 'seconds'
  | 'minute'
  | 'minutes'
  | 'hour'
  | 'hours'
  | 'day'
  | 'days'
  | 'week'
  | 'weeks'
  | 'month'
  | 'months'
  | 'year'
  | 'years';

export function parseDateString(input: string): Date | null {
  if (input === null || input === undefined || input === '') {
    return null;
  }
  const s = input.trim().toLowerCase();

  // 1) Handle "X unit(s) ago"
  const relRegex =
    /^(\d+)\s+(seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s+ago$/;
  const relMatch = s.match(relRegex);
  if (relMatch) {
    const value = parseInt(relMatch[1], 10);
    const unit = relMatch[2] as RelativeUnit;
    const now = new Date();

    switch (unit) {
      case 'second':
      case 'seconds':
        now.setSeconds(now.getSeconds() - value);
        break;
      case 'minute':
      case 'minutes':
        now.setMinutes(now.getMinutes() - value);
        break;
      case 'hour':
      case 'hours':
        now.setHours(now.getHours() - value);
        break;
      case 'day':
      case 'days':
        now.setDate(now.getDate() - value);
        break;
      case 'week':
      case 'weeks':
        now.setDate(now.getDate() - value * 7);
        break;
      case 'month':
      case 'months':
        now.setMonth(now.getMonth() - value);
        break;
      case 'year':
      case 'years':
        now.setFullYear(now.getFullYear() - value);
        break;
    }

    return now;
  }

  // 2) Try parsing as an absolute date
  //    We assume formats like "Mar 12, 2025", "2025-03-12", etc.
  const parsed = new Date(input);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Unrecognized date format: "${input}"`);
  }
  return parsed;
}
