export interface TimesheetEntry {
  date: string;
  duration?: string;
  employee?: string;
  endTime: string;
  startTime: string;
}

export function calculateDuration(startTime: string, endTime: string): string {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  if (!start || !end) {
    return "0:00";
  }

  const startMinutes = start.hours * 60 + start.minutes;
  let endMinutes = end.hours * 60 + end.minutes;

  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const durationMinutes = endMinutes - startMinutes;
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export function parseTime(
  timeStr: string,
): null | { hours: number; minutes: number } {
  const cleanTime = timeStr.replaceAll(/[^\d:]/g, "");
  const match = /^(\d{1,2}):(\d{2})$/.exec(cleanTime);

  if (!match) {
    return null;
  }

  const [, hh, mm] = match;
  if (hh === undefined || mm === undefined) {
    return null;
  }
  const hours = Number.parseInt(hh, 10);
  const minutes = Number.parseInt(mm, 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return { hours, minutes };
}

export function processTimesheetEntries(
  entries: Omit<TimesheetEntry, "duration">[],
): TimesheetEntry[] {
  return entries.map((entry) => ({
    ...entry,
    duration: calculateDuration(entry.startTime, entry.endTime),
  }));
}
