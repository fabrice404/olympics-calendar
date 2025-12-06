import { get } from "axios";
import Debug from "debug";
import { writeFileSync } from "fs";

import { Cache } from "./cache";
import { ICSGenerator } from "./ics-generator";
import { Calendar, Event, Language, PageData, Sport, Team } from "./types";

const BASE_URL = "https://www.olympics.com";
const BASE_SCHEDULE_PATH = "milano-cortina-2026/schedule/overview";

export class Scraper {
  private cache = new Cache();
  private debug = Debug("olympics-calendar:scraper");

  private events: Event[] = [];
  private languages: Language[] = [];
  private nocs: Team[] = [];
  private sports: Sport[] = [];

  private async getPageData(path: string): Promise<PageData> {
    this.debug(`getPageData: path=${path}`);
    if (!this.cache.has(path)) {
      const url = `${BASE_URL}${path}`;
      this.debug(url);
      const response = await get(url, {
        headers: {
          "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
        },
      });
      const page = await response.data;
      const dataMatch = page.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
      );
      if (!dataMatch) {
        throw new Error(
          `Could not find __NEXT_DATA__ script tag for URL: ${url}`,
        );
      }
      const data = dataMatch[1];
      if (data) {
        this.cache.set(path, JSON.stringify(JSON.parse(data), null, 2));
      }
    }

    return JSON.parse(this.cache.get(path)!);
  }

  private saveCalendar(): void {
    this.debug("saveCalendar");
    const calendar = this.getCalendar();
    writeFileSync("./output/calendar.json", JSON.stringify(calendar));
  }

  private async scrapeEvents(): Promise<void> {
    this.debug("scrapeEvents");
    for (const sport of this.sports) {
      for (const lang of this.languages) {
        const data = await this.getPageData(
          `/${lang.code}/milano-cortina-2026/schedule/${sport.key}`,
        );
        const scheduleList = data.props.pageProps.page.items
          .find(
            (item) => item.type === "module" && item.name === "scheduleList",
          )!
          .data.schedules.map((schedule) => schedule.units)
          .flat();

        for (const scheduleElement of scheduleList) {
          if (
            this.events.find((e) => e.key === scheduleElement.unitCode) == null
          ) {
            this.events.push({
              key: scheduleElement.unitCode,
              sport: sport.key,
              start: scheduleElement.startDateTimeUtc,
              end: scheduleElement.endDateTimeUtc,
              isTraining: scheduleElement.isTraining,
              medal: scheduleElement.medal,
              name: {},
              location: {},
            });
          }
          const event = this.events.find(
            (e) => e.key === scheduleElement.unitCode,
          )!;
          event.name[lang.code] = scheduleElement.description;
          event.location[lang.code] = scheduleElement.venue?.description || "";

          if (scheduleElement.match) {
            if (event.match == null) {
              event.match = {
                team1: {
                  key: scheduleElement.match.team1.teamCode.replace(
                    /[^A-Z]/gi,
                    "",
                  ),
                  name: {},
                },
                team2: {
                  key: scheduleElement.match.team2.teamCode.replace(
                    /[^A-Z]/gi,
                    "",
                  ),
                  name: {},
                },
              };
            }
            event.match.team1.name[lang.code] = (
              scheduleElement.match.team1.description || ""
            ).replace(/,/gi, "");
            event.match.team2.name[lang.code] = (
              scheduleElement.match.team2.description || ""
            ).replace(/,/gi, "");

            for (const team of [
              scheduleElement.match.team1,
              scheduleElement.match.team2,
            ]) {
              const nocKey = team.teamCode.replace(/[^A-Z]/gi, "");
              if (this.nocs.find((n) => n.key === nocKey) == null) {
                this.nocs.push({ key: nocKey, name: {} });
              }
              const noc = this.nocs.find((n) => n.key === nocKey)!;
              noc.name[lang.code] = (team.description || "").replace(/,/gi, "");
            }
          }
        }
      }
    }
  }

  private async scrapeLanguages(): Promise<void> {
    this.debug("scrapeLanguages");
    const pageData = await this.getPageData(`/en/${BASE_SCHEDULE_PATH}`);
    const languagesData =
      pageData.props.pageProps.page.template.properties.header.mainNav
        .languages;

    this.languages = languagesData
      .filter((lang) =>
        lang.link.match(/\/milano-cortina-2026\/schedule\/overview$/),
      )
      .map((lang) => ({
        code: lang.lang,
        name: lang.label,
      }));
  }

  private async scrapeSports(): Promise<void> {
    this.debug("scrapeSports");
    for (const lang of this.languages) {
      this.debug(`Scraping language: ${lang.code}`);
      const pageData = await this.getPageData(
        `/${lang.code}/${BASE_SCHEDULE_PATH}`,
      );

      const disciplines = pageData.props.pageProps.page.items.find(
        (item) => item.type === "module" && item.name === "scheduleGrid",
      )!.data.disciplines;

      for (const discipline of disciplines.filter(
        (d) => d.disciplineCode.toLowerCase() !== "cer",
      )) {
        const key = discipline.disciplineCode.toLowerCase();
        if (this.sports.find((s) => s.key === key) == null) {
          this.sports.push({ key, name: {}, order: -1 });
        }
        const sport = this.sports.find((s) => s.key === key)!;
        sport.name[lang.code] = discipline.description;
        sport.order = discipline.order;
      }
    }
  }

  public getCalendar(): Calendar {
    return {
      languages: this.languages,
      sports: this.sports,
      nocs: this.nocs,
      events: this.events,
    };
  }

  public async scrape(): Promise<void> {
    this.debug("scrape");
    await this.scrapeLanguages();
    await this.scrapeSports();
    await this.scrapeEvents();

    this.saveCalendar();
    new ICSGenerator(this.getCalendar()).generate();
  }
}
