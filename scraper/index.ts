import Debug from "debug";

import * as cache from "./cache";
import { mkdirSync, writeFileSync } from "fs";
import { Calendar, Event, Sport, Team } from "./types";
import { generateICSFiles } from "./ics";

const baseUrl = "https://www.olympics.com";
const basePath = "/milano-cortina-2026/schedule/overview";

const debug = Debug(`olympics-calendar:index`);


const getScheduleOverview = async (language: string) => {
  debug(`getScheduleOverview: language=${language}`);

  const scheduleOverviewKey = `${language}/schedule-overview`;

  if (!cache.has(scheduleOverviewKey)) {
    debug(`Fetching ${baseUrl}/${language}${basePath}`);
    const response = await fetch(`${baseUrl}/${language}/${basePath}`);
    const page = await response.text();
    const dataMatch = page.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!dataMatch) {
      throw new Error("Could not find __NEXT_DATA__ script tag");
    }
    const data = dataMatch[1];
    cache.set(scheduleOverviewKey, JSON.stringify(JSON.parse(data), null, 2));
  }

  const scheduleOverview = JSON.parse(cache.get(scheduleOverviewKey)!);
  return scheduleOverview;
};

const getScheduleSport = async (language: string, sportCode: string) => {
  debug(`getScheduleSport: language=${language}, sportCode=${sportCode}`);

  const scheduleSportKey = `${language}/${sportCode}`;

  if (!cache.has(scheduleSportKey)) {
    debug(`Fetching ${baseUrl}/${language}/milano-cortina-2026/schedule/${sportCode}`);
    const response = await fetch(`${baseUrl}/${language}/milano-cortina-2026/schedule/${sportCode}`);
    const page = await response.text();
    const dataMatch = page.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!dataMatch) {
      return null;
      debug(`No data found for sportCode=${sportCode} in language=${language}`);
    }
    const data = dataMatch[1];
    cache.set(scheduleSportKey, JSON.stringify(JSON.parse(data), null, 2));
  }

  const scheduleSport = JSON.parse(cache.get(scheduleSportKey)!);
  return scheduleSport;
};

const main = async () => {
  const overview = await getScheduleOverview("en");
  const languages = overview.props.pageProps.page.template.properties.header.mainNav.languages
    .filter((lang: any) => lang.link.match(/\/milano-cortina-2026\/schedule\/overview$/))
    .map((lang: any) => ({
      code: lang.lang,
      name: lang.label,
    }))

  const sports: Sport[] = [];
  const events: Event[] = [];
  let nocs: Team[] = [];

  for (const lang of languages) {
    const scheduleOverview = await getScheduleOverview(lang.code);

    const disciplines = scheduleOverview.props.pageProps.page.items
      .find((item: any) => item.type === "module" && item.name === "scheduleGrid")
      .data.disciplines;

    for (const discipline of disciplines) {
      const key = discipline.disciplineCode.toLowerCase();
      if (key !== "cer") {
        if (sports.find((s: any) => s.key === key) == null) {
          sports.push({ key, name: {}, order: -1 })
        }
        const sport = sports.find((s: any) => s.key === key)!;
        sport.name[lang.code] = discipline.description;
        sport.order = discipline.order;

        const scheduleSport = await getScheduleSport(lang.code, sport.key);
        const scheduleList = scheduleSport.props.pageProps.page.items.find((item: any) => item.type === "module" && item.name === "scheduleList").data.schedules.map((schedule: any) => schedule.units).flat()

        for (const scheduleListElement of scheduleList) {
          if (events.find(e => e.key === scheduleListElement.unitCode) == null) {
            events.push({
              key: scheduleListElement.unitCode,
              sport: sport.key,
              start: scheduleListElement.startDateTimeUtc,
              end: scheduleListElement.endDateTimeUtc,
              isTraining: scheduleListElement.isTraining,
              medal: scheduleListElement.medal,
              name: {},
              location: {},
            })
          }
          const event = events.find(e => e.key === scheduleListElement.unitCode)!;
          event.name[lang.code] = scheduleListElement.description;
          event.location[lang.code] = scheduleListElement.venue?.description || ''

          if (scheduleListElement.match) {
            if (event.match == null) {
              event.match = {
                team1: { key: scheduleListElement.match.team1.teamCode.replace(/[^A-Z]/gi, ''), name: {} },
                team2: { key: scheduleListElement.match.team2.teamCode.replace(/[^A-Z]/gi, ''), name: {} },
              };
            }
            event.match.team1.name[lang.code] = (scheduleListElement.match.team1.description || '').replace(/\,/gi, '');
            event.match.team2.name[lang.code] = (scheduleListElement.match.team2.description || '').replace(/\,/gi, '');


            for (const team of [scheduleListElement.match.team1, scheduleListElement.match.team2]) {
              const nocKey = team.teamCode.replace(/[^A-Z]/gi, '');
              if (nocs.find(n => n.key === nocKey) == null) {
                nocs.push({ key: nocKey, name: {} });
              }
              const noc = nocs.find(n => n.key === nocKey)!;
              noc.name[lang.code] = (team.description || '').replace(/\,/gi, '');
            }
          }
        }
      }
    }
  }

  nocs = nocs.filter((noc) => noc.key !== noc.name.en);

  const dataFolder = "../ui/public/data";
  mkdirSync(dataFolder, { recursive: true });
  const calendar: Calendar = { languages, sports, nocs, events };
  writeFileSync(`${dataFolder}/calendar.json`, JSON.stringify(calendar));
  generateICSFiles(calendar);
};

main();
