import * as fs from "node:fs";
import Debug from "debug";

import { Event } from "./types";

const debug = Debug("paris2024:ics");

/**
 * generateICS generates the calendar for given events on ICS format
 * @param {string} title 
 * @param {string} key 
 * @param {object[]} events 
 */
export const generateICS = (title: string, key: string, events: Event[]): void => {
  // debug(`Generating ICS file for ${title} (${key}) with ${events.length} events`);
  const lines: string[] = [];
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
        .map(([key, value]) => {
          let result = `${key}:${value}`;
          if (result.length > 75) {
            if (key === "DESCRIPTION") {
              const lines = [];
              while (result.length > 75) {
                let index = 75;
                while (result[index] !== " " && index > 0) {
                  index--;
                }
                lines.push(result.slice(0, index));
                result = "  " + result.slice(index).trim();
              }
              lines.push(result);
              return lines.join("\r\n").trim();
            }
            return `${key}:${value}`.slice(0, 75);
          }
          return `${key}:${value}`;

        }),
    );
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const calendarPath = `${__dirname}/../docs/${key}.ics`;
  const folder = calendarPath.split("/").slice(0, -1).join("/");
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(calendarPath, lines.join("\r\n"));
};

