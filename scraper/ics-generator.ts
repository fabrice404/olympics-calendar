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

  private cleanLine(line: string): string {
    if (line.length <= 75) {
      return line;
    }
    const chunks: string[] = [];
    let index = 0;
    while (index < line.length) {
      let chunk = line.slice(index, index + 75);
      if (index > 0) {
        chunk = "  " + chunk.trim();
      }
      chunks.push(chunk);
      index += 75;
    }
    return chunks.join("\n");
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

    let types = ["all-events", "medal-events", "gold-medal-events"];
    if (nocKey) {
      types = ["all-events"];
    }

    for (const type of types) {
      for (const lang of this.calendar.languages) {
        const pathSportKey = sportKey || "all-sports";
        let pathCalendar = "calendar";
        if (type !== "all-events") {
          pathCalendar = type;
        } else if (nocKey) {
          pathCalendar = nocKey;
        }

        const filepath = `./output/${lang.code.toLowerCase()}/${pathSportKey.toLowerCase()}/${pathCalendar.toLowerCase()}.ics`;
        mkdirSync(filepath.split("/").slice(0, -1).join("/"), { recursive: true });

        const titleComponents: string[] = [];
        if (nocKey) {
          titleComponents.push(
            `${this.calendar.nocs.find((n) => n.key === nocKey)!.name[lang.code]}`,
          );
        }
        if (sportKey) {
          titleComponents.push(this.calendar.sports.find((s) => s.key === sportKey)!.name[lang.code] || "");
        }
        titleComponents.push("Milano Cortina 2026");

        const title = titleComponents.join(" - ");

        const lines: string[] = [];

        lines.push("BEGIN:VCALENDAR");
        lines.push("VERSION:2.0");
        lines.push(
          `PRODID:-//fabrice404//olympics-calendar//${lang.code}/${pathSportKey}/${pathCalendar}`,
        );
        lines.push(`X-WR-CALNAME:${title}`);
        lines.push(`NAME:${title}`);

        this.calendar.events
          .filter((event) => {
            if ((sportKey && event.sport !== sportKey) || event.sport === "CER") {
              return false;
            }
            if (nocKey && !event.nocs.includes(nocKey)) {
              return false;
            }
            if (
              (type === "medal-events" && event.medal === "0") ||
              (type === "gold-medal-events" && event.medal !== "1")
            ) {
              return false;
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
            let description = `DESCRIPTION:${sport.name[lang.code]} - ${event.name[lang.code] || ""}`;
            let summary = `SUMMARY:${event.name[lang.code] || ""}`;

            if (event.competitors?.length === 2) {
              const competitor1 = this.getCompetitor(event.competitors[0]!, lang.code);
              const competitor2 = this.getCompetitor(event.competitors[1]!, lang.code);

              if (competitor1 && competitor2) {
                summary = `SUMMARY:${competitor1?.flag} ${competitor1.name} - ${competitor2?.name} ${competitor2.flag}`;
              }
            } else if (event.competitors?.length > 0) {
              const competitors = event.competitors
                .map((competitorId) => this.getCompetitor(competitorId, lang.code))
                .map((competitor) => `\\n${competitor.flag} ${competitor.name}`).join("");
              description += `${competitors}`;
            }

            lines.push(summary);
            lines.push(this.cleanLine(description));
            lines.push("END:VEVENT");
          });

        lines.push("END:VCALENDAR");

        if (lines.length <= 10) {
          this.debug("Skipping empty ICS file:", filepath);
        } else {
          writeFileSync(filepath, lines.join("\n"), "utf-8");
        }
      }
    }
  }

  private getCompetitor(competitorId: string, lang: string) {
    if (competitorId.startsWith("team:")) {
      const team = this.calendar.nocs.find(noc => noc.key === competitorId.replace("team:", ""));
      return {
        noc: team?.key,
        name: team?.name[lang] || team?.key || competitorId,
        flag: getFlag(team?.key || ""),
      };
    }
    const competitor = this.calendar.competitors.find(comp => comp.code === competitorId);
    if (!competitor) {
      this.debug(`Competitor not found: ${competitorId}`);
      return {
        noc: "",
        name: competitorId,
        flag: "🏳️",
      };
    }
    return {
      noc: competitor.noc,
      name: competitor.name,
      flag: getFlag(competitor.noc),
    };
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
