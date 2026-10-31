// Builds a calendar file for a booking, so the trip can be added to any calendar app.
function stamp(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escape(text) {
  return text.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
}

export function bookingToIcs({ ref, departAt, arriveAt, title, location, description }) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rihla//Bus tickets//EN",
    "BEGIN:VEVENT",
    `UID:${ref}@rihla`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(departAt)}`,
    `DTEND:${stamp(arriveAt)}`,
    `SUMMARY:${escape(title)}`,
    `LOCATION:${escape(location)}`,
    `DESCRIPTION:${escape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
