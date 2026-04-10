interface VEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: Date;
  dtend: Date;
  location?: string;
}

function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function generateVEvent(event: VEvent): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(event.dtstart)}`,
    `DTEND:${formatIcsDate(event.dtend)}`,
    `SUMMARY:${event.summary}`,
  ];
  if (event.description) lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
  if (event.location) lines.push(`LOCATION:${event.location}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

export function generateVCalendar(events: VEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EdgeConnect//JP",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:EdgeConnect",
    "X-WR-TIMEZONE:Asia/Tokyo",
  ];
  for (const event of events) {
    lines.push(generateVEvent(event));
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// Googleカレンダー用URL生成
export function generateGoogleCalendarUrl(
  title: string,
  startAt: Date,
  endAt: Date,
  details?: string
): string {
  // GoogleカレンダーはUTC形式 YYYYMMDDTHHmmSSZ を要求
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dates = `${fmt(startAt)}/${fmt(endAt)}`;
  // calendar/event はモバイルでも安定動作する
  let url = `https://www.google.com/calendar/event?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dates}`;
  if (details) url += `&details=${encodeURIComponent(details)}`;
  return url;
}
