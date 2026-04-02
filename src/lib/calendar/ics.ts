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
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${fmt(startAt)}/${fmt(endAt)}`,
  });
  if (details) params.set("details", details);
  return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
}
