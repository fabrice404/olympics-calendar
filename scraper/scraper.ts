import Debug from "debug";
import { writeFileSync } from "fs";

import { Cache } from "./cache";
import { ICSGenerator } from "./ics-generator";
import { Calendar, Event, Language, Sport, NOC, Competitor } from "./types";

const proxy = process.env.HTTP_PROXY || "";

export class Scraper {
  private readonly cache = new Cache();

  private readonly competitors: Competitor[] = [];

  private readonly debug = Debug("olympics-calendar:scraper");

  private readonly events: Event[] = [];
  private readonly languages: Language[] = [
    { code: "en", name: "English", code3: "ENG" },
    { code: "it", name: "Italiano", code3: "ITA" },
    { code: "fr", name: "Français", code3: "FRA" },
    { code: "de", name: "Deutsch", code3: "DEU" },
    { code: "pt", name: "Português", code3: "POR" },
    { code: "es", name: "Español", code3: "SPA" },
    { code: "ja", name: "日本語", code3: "JPN" },
    { code: "zh", name: "中文", code3: "CHI" },
    { code: "hi", name: "हिन्दी", code3: "HIN" },
    { code: "ko", name: "한국어", code3: "KOR" },
    { code: "ru", name: "Русский", code3: "RUS" },
  ];

  private readonly nocs: NOC[] = [];
  private readonly sports: Sport[] = [];

  private dateToUtcString(dateString: string): string {
    const date = new Date(dateString);
    const utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
    return new Date(utc).toISOString();
  }

  private async getJSONData(url: string, cacheKey: string): Promise<any> {
    this.debug(`getJSONData: url=${url}`);

    if (!this.cache.has(cacheKey)) {
      const response = await fetch(`${proxy}${url}`, {
        "headers": {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-US,en;q=0.9,fr-FR;q=0.8,fr;q=0.7",
          "cache-control": "max-age=0",
          "priority": "u=0, i",
          "sec-ch-ua": "\"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"144\", \"Google Chrome\";v=\"144\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "none",
          "sec-fetch-user": "?1",
          "upgrade-insecure-requests": "1",
        },
        "body": null,
        "method": "GET"
      });
      const result = await response.json();
      this.cache.set(cacheKey, JSON.stringify(result, null, 2));
    }

    return JSON.parse(this.cache.get(cacheKey)!);
  }

  private saveCalendar(): void {
    this.debug("saveCalendar");
    const calendar = this.getCalendar();
    writeFileSync("./output/calendar.json", JSON.stringify(calendar, null, 2), "utf-8");
  }

  private async scrapeEvents(): Promise<void> {
    this.debug("scrapeEvents");

    for (const lang of this.languages) {
      this.debug(`Scraping events: ${lang.code}`);

      for (let i = 3; i <= 23; i++) {

        const url = `https://www.olympics.com/wmr-owg2026/schedules/api/${lang.code3}/schedule/lite/day/2026-02-${i.toString().padStart(2, "0")}`;
        const data = await this.getJSONData(url, `schedules/day/2026-02-${i.toString().padStart(2, "0")}/${lang.code3}`);


        for (const event of data.units) {
          if (!event.endDate) {
            continue;
          }
          const { id: key } = event;
          if (!this.events.some((e) => e.key === key)) {
            this.events.push({
              key,
              sport: event.disciplineCode,
              start: this.dateToUtcString(event.startDate),
              end: this.dateToUtcString(event.endDate),
              medal: event.medalFlag.toString(),
              name: {},
              location: {},
              nocs: [],
              competitors: [],
            });
          }

          const calendarEvent = this.events.find((e) => e.key === key)!;
          calendarEvent.name[lang.code] = event.eventUnitName;
          calendarEvent.location[lang.code] = event.venueDescription;

          if (event.competitors) {
            for (const competitor of event.competitors) {
              if (competitor.code === "TBD") {
                continue;
              }
              const { code, name, noc, competitorType } = competitor;
              if (!calendarEvent.nocs.some((n) => n === noc)) {
                calendarEvent.nocs.push(noc);
              }

              if (competitorType) {
                if (!calendarEvent.competitors.some((c) => c === code)) {
                  calendarEvent.competitors.push(code);
                }
                this.setCompetitor(code, noc, name);
                this.setNoc(noc, "", lang.code);
              } else {
                const key = `team:${noc}`;
                if (!calendarEvent.competitors.some((c) => c === key)) {
                  calendarEvent.competitors.push(key);
                }
                this.setNoc(noc, name, lang.code);
              }
            }
          }
        }
      }
    }
  }

  private async scrapeNOCs(): Promise<void> {
    this.debug("scrapeNOCs");
    for (const lang of this.languages) {
      this.debug(`Scraping NOCs: ${lang.code}`);
      const url = `https://www.olympics.com/wmr-owg2026/info/api/${lang.code3}/nocs`;
      const data = await this.getJSONData(url, `nocs/${lang.code3}`);

      for (const noc of this.nocs) {
        const found = data.nocs.find((n) => n.id === noc.key);
        this.setNoc(found.id, found.name, lang.code);
      }
    }
  }

  private async scrapeSports(): Promise<void> {
    this.debug("scrapeSports");
    for (const lang of this.languages) {
      this.debug(`Scraping sports: ${lang.code}`);

      const url = `https://www.olympics.com/wmr-owg2026/info/api/${lang.code3}/disciplinesevents`;
      const data = await this.getJSONData(url, `disciplinesevents/${lang.code3}`);
      for (const discipline of data.disciplines) {
        const { id, name } = discipline;
        if (!this.sports.some((s) => s.key === id)) {
          this.sports.push({ key: id, name: {}, order: 0 });
        }
        const sport = this.sports.find((s) => s.key === id)!;
        sport.name[lang.code] = name;
      }
    }

    this.sports
      .toSorted((a, b) => (a.order < b.order ? -1 : 1))
      .forEach((sport, index) => {
        sport.order = index + 1;
      });
  }

  private setCompetitor(code: string, noc: string, name: string): void {
    if (!code)
      return;

    if (!this.competitors.some((c) => c.code === code)) {
      this.competitors.push({ code, noc, name });
    }
  }

  private setNoc(key: string, name: string, langCode: string): void {
    if (!key)
      return;

    if (!this.nocs.some((n) => n.key === key)) {
      console.log(key);
      this.nocs.push({ key, name: {} });
    }
    const noc = this.nocs.find((n) => n.key === key)!;
    noc.name[langCode] = name;
  }

  public getCalendar(): Calendar {
    return {
      languages: this.languages,
      sports: this.sports,
      nocs: this.nocs,
      competitors: this.competitors,
      events: this.events,
    };
  }

  public async scrape(): Promise<void> {
    this.debug("scrape");

    await this.scrapeSports();
    await this.scrapeEvents();
    await this.scrapeNOCs();

    this.saveCalendar();
    new ICSGenerator(this.getCalendar()).generate();
  }
}
