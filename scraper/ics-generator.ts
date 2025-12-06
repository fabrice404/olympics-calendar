import Debug from "debug";
import { mkdirSync, writeFileSync } from "fs";

import { getFlag } from "./nocs";
import { Calendar } from "./types";

export class ICSGenerator {
  private calendar: Calendar;

  private debug = Debug("olympics-calendar:ics-generator");

  constructor(calendar: Calendar) {
    this.calendar = calendar;
  }

  private generateICSFile(
    sportKey: string | null,
    nocKey: string | null,
  ): void {
    this.debug(
      "generateICSFile",
      sportKey || "all-sports",
      nocKey || "all-nocs",
    );
    this.calendar.languages.forEach((lang) => {
      const pathSportKey = sportKey ? sportKey : "all-sports";
      const pathNocKey = nocKey ? nocKey : "calendar";

      const filepath = `./output/${lang.code.toLowerCase()}/${pathSportKey.toLowerCase()}/${pathNocKey.toLowerCase()}.ics`;
      mkdirSync(filepath.split("/").slice(0, -1).join("/"), { recursive: true });

      const titleComponents = [];
      if (nocKey) {
        titleComponents.push(
          `${this.calendar.nocs.find((n) => n.key === nocKey)!.name[lang.code]}`,
        );
      }
      if (sportKey) {
        titleComponents.push(this.calendar.sports.find((s) => s.key === sportKey)!.name[lang.code]);
      }
      titleComponents.push("Milano Cortina 2026");

      const title = titleComponents.join(" - ");

      const lines = [];

      lines.push("BEGIN:VCALENDAR");
      lines.push("VERSION:2.0");
      lines.push(
        `PRODID:-//fabrice404//olympics-calendar//${lang.code}/${pathSportKey}/${pathNocKey}`,
      );
      lines.push(`X-WR-CALNAME:${title}`);
      lines.push(`NAME:${title}`);

      this.calendar.events
        .filter((event) => {
          if (sportKey && event.sport !== sportKey) return false;
          if (nocKey) {
            if (event.match) {
              const team1Key = event.match.team1.key;
              const team2Key = event.match.team2.key;
              if (team1Key !== nocKey && team2Key !== nocKey) {
                return false;
              }
            } else {
              return false;
            }
          }
          return true;
        })
        .forEach((event) => {
          lines.push("BEGIN:VEVENT");
          lines.push(`UID:${event.key.replace(/--/g, "-")}`);
          lines.push(`DTSTAMP:${event.start.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`);
          lines.push(`DTSTART:${event.start.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`);
          lines.push(`DTEND:${event.end.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z")}`);
          lines.push(`LOCATION:${event.location[lang.code] || ""}`);

          const sport = this.calendar.sports.find(
            (s) => s.key === event.sport,
          )!;
          lines.push(`DESCRIPTION:${sport.name[lang.code]} - ${event.name[lang.code] || ""}`);
          const summary = `SUMMARY:${event.name[lang.code] || ""}`;

          if (event.match) {
            const team1Name = event.match.team1.name[lang.code] || event.match.team1.key;
            const team1Flag = getFlag(event.match.team1.key);
            const team2Name = event.match.team2.name[lang.code] || event.match.team2.key;
            const team2Flag = getFlag(event.match.team2.key);
            if (team1Name && team2Name) {
              lines.push(`SUMMARY:${team1Flag} ${team1Name} - ${team2Name} ${team2Flag}`);
            }
          }

          lines.push(summary);
          lines.push("END:VEVENT");
        });

      lines.push("END:VCALENDAR");

      writeFileSync(filepath, lines.join("\n"));
    });
  }

  public generate(): void {
    this.debug("generate");
    this.generateICSFile(null, null);

    this.calendar.sports.forEach((sport) => {
      this.generateICSFile(sport.key, null);
      this.calendar.nocs.forEach((noc) => {
        this.generateICSFile(sport.key, noc.key);
      });
    });

    this.calendar.nocs.forEach((noc) => {
      this.generateICSFile(null, noc.key);
    });
  }
}
