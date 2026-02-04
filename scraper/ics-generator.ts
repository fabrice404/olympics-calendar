import Debug from "debug";
import { mkdirSync, writeFileSync } from "fs";

import { getFlag } from "./nocs";
import { Calendar, Event } from "./types";

const MEDAL_EVENTS_LABEL: { [key: string]: string } = {
  en: "Medal Events",
  fr: "Événements avec médailles",
  es: "Eventos de medallas",
  de: "Medaillen-Events",
  it: "Eventi con medaglie",
  pt: "Eventos de medalhas",
  zh: "奖牌赛事",
  ja: "メダルイベント",
  hi: "पदक स्पर्धाएं",
  ko: "메달 이벤트",
  ru: "Медальные события",
};

export class ICSGenerator {
  private calendar: Calendar;

  private debug = Debug("olympics-calendar:ics-generator");

  constructor(calendar: Calendar) {
    this.calendar = calendar;
  }

  private buildTitle(
    lang: { code: string; name: string; code3: string },
    sportKey: string | null,
    nocKey: string | null,
    medalOnly: boolean,
  ): string {
    const titleComponents: string[] = [];
    if (nocKey) {
      const noc = this.calendar.nocs.find((n) => n.key === nocKey);
      const nocName = noc?.name[lang.code] || noc?.name["en"] || "";
      titleComponents.push(nocName);
    }
    if (sportKey) {
      const sport = this.calendar.sports.find((s) => s.key === sportKey);
      const sportName = sport?.name[lang.code] || sport?.name["en"] || "";
      titleComponents.push(sportName);
    }
    if (medalOnly) {
      titleComponents.push(MEDAL_EVENTS_LABEL[lang.code] ?? MEDAL_EVENTS_LABEL["en"] ?? "Medal Events");
    }
    titleComponents.push("Milano Cortina 2026");
    return titleComponents.join(" - ");
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
    medalOnly: boolean = false,
  ): void {
    this.debug(
      "generateICSFile",
      sportKey || "all-sports",
      nocKey || "all-nocs",
      medalOnly ? "medal-only" : "all-events",
    );

    for (const lang of this.calendar.languages) {
      const pathSportKey = sportKey ? sportKey : "all-sports";
      const pathNocKey = nocKey ? nocKey : "calendar";
      const medalPath = medalOnly ? "medal/" : "";

      const filepath = `./output/${lang.code.toLowerCase()}/${pathSportKey.toLowerCase()}/${medalPath}${pathNocKey.toLowerCase()}.ics`;
      mkdirSync(filepath.split("/").slice(0, -1).join("/"), { recursive: true });

      const title = this.buildTitle(lang, sportKey, nocKey, medalOnly);

      const lines: string[] = [];

      lines.push("BEGIN:VCALENDAR");
      lines.push("VERSION:2.0");
      lines.push(
        `PRODID:-//fabrice404//olympics-calendar//${lang.code}/${pathSportKey}/${medalPath}${pathNocKey}`,
      );
      lines.push(`X-WR-CALNAME:${title}`);
      lines.push(`NAME:${title}`);

      this.calendar.events
        .filter((event) => this.shouldIncludeEvent(event, sportKey, nocKey, medalOnly))
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
        writeFileSync(filepath, lines.join("\n"));
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
    const competitor = this.calendar.competitors.find(comp => comp.code === competitorId)!;
    return {
      noc: competitor.noc,
      name: competitor.name,
      flag: getFlag(competitor.noc),
    };
  }

  private shouldIncludeEvent(
    event: Event,
    sportKey: string | null,
    nocKey: string | null,
    medalOnly: boolean,
  ): boolean {
    if ((sportKey && event.sport !== sportKey) || event.sport === "CER") {
      return false;
    }
    if (nocKey && !event.nocs.includes(nocKey)) {
      return false;
    }
    if (medalOnly && event.medal === "0") {
      return false;
    }
    return true;
  }

  public generate(): void {
    this.debug("generate");
    this.generateICSFile(null, null);
    this.generateICSFile(null, null, true); // Generate medal-only calendar for all sports and all NOCs

    this.calendar.sports.forEach((sport) => {
      this.generateICSFile(sport.key, null);
      this.generateICSFile(sport.key, null, true); // Generate medal-only calendar for this sport
      this.calendar.nocs.forEach((noc) => {
        this.generateICSFile(sport.key, noc.key);
        this.generateICSFile(sport.key, noc.key, true); // Generate medal-only calendar for this sport and NOC
      });
    });

    this.calendar.nocs.forEach((noc) => {
      this.generateICSFile(null, noc.key);
      this.generateICSFile(null, noc.key, true); // Generate medal-only calendar for this NOC
    });
  }
}
