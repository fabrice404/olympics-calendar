const fs = require("fs");

/**
 * generateICS generates the calendar for given events on ICS format
 * @param {string} title 
 * @param {string} key 
 * @param {object[]} events 
 */
const generateICS = (title, key, events) => {
  const lines = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(`PRODID:-//fabrice404//olympics-calendar//${key}//EN`);
  lines.push(`X-WR-CALNAME:${title}`);
  lines.push(`NAME:${title}`);

  events.forEach((event) => {
    lines.push("BEGIN:VEVENT");
    lines.push(
      ...Object.entries(event)
        .filter(([key]) => !key.startsWith("_"))
        .map(([key, value]) => `${key}:${value}`),
    );
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const calendarPath = `${__dirname}/../docs/${key}.ics`;
  const folder = calendarPath.split("/").slice(0, -1).join("/");
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(calendarPath, lines.join("\r\n"));
};

module.exports = {
  generateICS,
};
