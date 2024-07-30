import Debug from "debug";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

import { Event, NOC, Sport } from "./types";
import { getAllSportsKeys, getSportIcon } from "./sports";
import { existsSync, writeFileSync } from "fs";
import { hasFile, readFile, saveFile } from "./io";
import cheerio from "cheerio";
import { getNOCFlag, getNOCName, isValidNOC } from "./nocs";
import * as translate from "./translate";
import { generateICS } from "./ics";

export class Calendar {
  private language: string;

  private debug: Debug.Debugger;

  private events: Event[] = [];
  private nocs: string[] = [];
  private sports: Sport[] = [];

  constructor(language: string) {
    this.language = language;
    this.debug = Debug(`paris2024:calendar:${language}`);
  }

  private addSport(sportKey: string, sportName: string) {
    if (!this.sports.find(sport => sport.key === sportKey)) {
      this.debug(`Adding sport: ${sportName} (${sportKey})`);
      this.sports.push({
        key: sportKey,
        name: sportName,
        NOCS: [],
      });
    }
  }

  private addNOC(noc: string) {
    if (!this.nocs.includes(noc)) {
      this.debug(`Adding NOC: ${noc}`);
      this.nocs.push(noc);
    }
  }

  private addSportNOC(sportKey: string, sportName: string, noc: string) {
    this.addSport(sportKey, sportName);
    const sport = this.sports.find((sport) => sport.key === sportKey)!;
    if (!sport.NOCS.includes(noc)) {
      this.debug(`Adding NOC: ${noc} to sport: ${sportKey}`);
      sport.NOCS.push(noc);
    }
  };

  public async generate() {
    this.debug(`Generating calendar for ${this.language}`);
    await Promise.all(getAllSportsKeys().map((sportKey) => this.getSportCalendar(sportKey)));

    this.genereateEventsCeremonies();
    this.generateCalendars();

    this.generateMainPage();
    this.generateTodaysPage();
    this.generateCSS();
  }

  private async getSportCalendar(sportKey: string) {
    const schedule = await this.downloadScheduleFromOfficialWebsite(sportKey);
    this.generateEventsFromSchedule(sportKey, schedule);
  }

  private async downloadScheduleFromOfficialWebsite(sportKey: string) {
    this.debug(`Checking cache for schedule for ${sportKey}`);
    const cacheFile = `${__dirname}/../cache/${this.language}/${sportKey}.html`;

    if (!hasFile(cacheFile)) {
      this.debug(`Downloading schedule for ${sportKey} in ${this.language}`);
      const response = await fetch(`https://olympics.com/${this.language}/paris-2024/schedule/${sportKey}`);
      const content = await response.text();
      saveFile(cacheFile, content);
    }

    const html = readFile(cacheFile);
    const $ = cheerio.load(html);
    return JSON.parse($("#__NEXT_DATA__").text());
  }

  private generateEventsFromSchedule(sportKey: string, data: any) {
    const sportName = data.query.pDisciplineLabel;
    const sportIcon = getSportIcon(sportKey);
    this.addSport(sportKey, sportName);

    data.props.pageProps.scheduleDataSource.initialSchedule.units.forEach((unit: any) => {
      unit.startDateTimeUtc = new Date(unit.startDate).toISOString().replace(".000", "");
      unit.endDateTimeUtc = new Date(unit.endDate).toISOString().replace(".000", "");

      const slugify = (text: string) => text.toLowerCase().replace(/\s/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

      const event: Event = {
        UID: `${unit.startDateTimeUtc.replace(/[:-]/g, "")}-${sportKey}-${slugify(unit.eventUnitName).toUpperCase()}`,
        DTSTAMP: unit.startDateTimeUtc.replace(/[:-]/g, ""),
        DTSTART: unit.startDateTimeUtc.replace(/[:-]/g, ""),
        DTEND: unit.endDateTimeUtc.replace(/[:-]/g, ""),
        DESCRIPTION: `${sportName} - ${unit.eventUnitName}`,
        SUMMARY: `${sportIcon} ${unit.eventUnitName}`.trim(),
        LOCATION: unit.venueDescription,
        _SPORT: sportKey,
        _NOCS: [],
        _COMPETITORS: [],
        _UNITNAME: unit.eventUnitName,
        _MEDAL: !!unit.medalFlag,
        _GENDER: unit.genderCode,
      };

      if (unit.competitors) {
        const competitors = unit.competitors
          .filter((competitor: any) => competitor.noc && isValidNOC(competitor.noc))
          .sort((a: any, b: any) => a.order > b.order ? 1 : -1);
        event._NOCS = competitors.map((competitor: any) => {
          this.addSportNOC(sportKey, sportName, competitor.noc);
          this.addNOC(competitor.noc);
          return competitor.noc;
        });

        // two competitors, we put them in the summary
        if (competitors.length === 2) {
          const competitor1 = competitors.shift();
          const competitor2 = competitors.shift();

          event.UID += `-${competitor1.noc}-${competitor2.noc}`;
          if (competitor1.name !== getNOCName(competitor1.noc)) {
            event.SUMMARY = `${sportIcon} ${competitor1.name} ${getNOCFlag(competitor1.noc)} - ${getNOCFlag(competitor2.noc)} ${competitor2.name}`;
          } else {
            event.SUMMARY = `${sportIcon} ${competitor1.noc} ${getNOCFlag(competitor1.noc)} - ${getNOCFlag(competitor2.noc)} ${competitor2.noc}`;
          }
        } else if (competitors.length !== 0) {
          // more than two, we put them in the description
          competitors
            .sort((a: any, b: any) => a.name > b.name ? 1 : -1)
            .forEach((competitor: any) => {
              if (competitor.name !== getNOCName(competitor.noc)) {
                event.DESCRIPTION += `\\n${getNOCFlag(competitor.noc)} ${competitor.name}`;
                event._COMPETITORS.push({ noc: competitor.noc, name: `${getNOCFlag(competitor.noc)} ${competitor.name}` });
              } else {
                event.DESCRIPTION += `\\n${getNOCFlag(competitor.noc)} ${competitor.noc}`;
              }
            });
        }
      }

      this.events.push(event);
    });
  }

  private genereateEventsCeremonies() {
    let startDateUtc = new Date("2024-07-26T17:30:00Z").toISOString().replace(".000", "");
    let endDateUtc = new Date("2024-07-26T21:00:00Z").toISOString().replace(".000", "");

    const opening: Event = {
      UID: `${startDateUtc.replace(/[:-]/g, "")}-opening-ceremony`,
      DTSTAMP: startDateUtc.replace(/[:-]/g, ""),
      DTSTART: startDateUtc.replace(/[:-]/g, ""),
      DTEND: endDateUtc.replace(/[:-]/g, ""),
      DESCRIPTION: `Paris 2024 - ${translate.openingCeremony.get(this.language)}`,
      SUMMARY: `Paris 2024 - ${translate.openingCeremony.get(this.language)}`,
      LOCATION: "Paris",
      _COMPETITORS: [],
      _GENDER: "",
      _MEDAL: false,
      _NOCS: this.nocs,
      _SPORT: "",
      _UNITNAME: "",
    };
    this.events.push(opening);

    startDateUtc = new Date("2024-08-11T19:00:00Z").toISOString().replace(".000", "");
    endDateUtc = new Date("2024-08-11T21:15:00Z").toISOString().replace(".000", "");

    const closing: Event = {
      UID: `${startDateUtc.replace(/[:-]/g, "")}-closing-ceremony`,
      DTSTAMP: startDateUtc.replace(/[:-]/g, ""),
      DTSTART: startDateUtc.replace(/[:-]/g, ""),
      DTEND: endDateUtc.replace(/[:-]/g, ""),
      DESCRIPTION: "Paris 2024 - Closing ceremony",
      SUMMARY: "Paris 2024 - Closing ceremony",
      LOCATION: "Stade de France, Saint-Denis",
      _COMPETITORS: [],
      _GENDER: "",
      _MEDAL: false,
      _NOCS: this.nocs,
      _SPORT: "",
      _UNITNAME: "",
    };
    this.events.push(closing);
  }

  private getKey(sportKey: string, noc: string) {
    if (this.language === "en") {
      return `${sportKey}/${noc}`;
    }
    return `${sportKey}/${this.language}/${noc}`;
  }

  private generateCalendars() {
    // sports
    for (const sport of this.sports) {
      // sport/general
      let events = this.events
        .filter((event) => event._SPORT === sport.key)
        .sort((a, b) => a.UID > b.UID ? 1 : -1);
      let key = this.getKey(sport.key, "general");
      let title = `${getSportIcon(sport.key)} ${sport.name} | Paris 2024`;
      if (events.length > 0) {
        generateICS(title, key, events);
      }

      // sport/medals
      events = this.events
        .filter((event) => event._SPORT === sport.key && event._MEDAL)
        .sort((a, b) => a.UID > b.UID ? 1 : -1);
      key = this.getKey(sport.key, "medals");
      title = `${getSportIcon(sport.key)} ${sport.name} 🏅 | Paris 2024`;
      if (events.length > 0) {
        generateICS(title, key, events);
      }

      // sport/noc
      for (const noc of sport.NOCS) {
        events = this.events
          .filter((event) => event._SPORT === sport.key && event._NOCS.includes(noc))
          .sort((a, b) => a.UID > b.UID ? 1 : -1);
        key = this.getKey(sport.key, noc);
        title = `${getNOCFlag(noc)} ${getNOCName(noc)} ${sport.name} | Paris 2024`;
        if (events.length > 0) {
          generateICS(title, key, events);
        }
      }
    }

    // nocs
    for (const noc of this.nocs) {
      // general/noc
      let events = this.events
        .filter((event) => event._NOCS.includes(noc))
        .sort((a, b) => a.UID > b.UID ? 1 : -1);
      let key = this.getKey("general", noc);
      let title = `${getNOCFlag(noc)} ${getNOCName(noc)} | Paris 2024`;
      if (events.length > 0) {
        generateICS(title, key, events);
      }

      // medals/noc
      events = this.events
        .filter((event) => event._NOCS.includes(noc) && event._MEDAL)
        .sort((a, b) => a.UID > b.UID ? 1 : -1);
      key = this.getKey("medals", noc);
      title = `${getNOCFlag(noc)} ${getNOCName(noc)} 🏅 | Paris 2024`
      if (events.length > 0) {
        generateICS(title, key, events);
      }
    }

    // general/general
    const events = this.events
      .sort((a, b) => a.UID > b.UID ? 1 : -1);
    const key = this.getKey("general", "general");
    const title = `Paris 2024`;
    if (events.length > 0) {
      generateICS(title, key, events);
    }

    // medals/general
    const medals = this.events
      .filter((event) => event._MEDAL)
      .sort((a, b) => a.UID > b.UID ? 1 : -1);
    const medalsKey = this.getKey("medals", "general");
    const medalsTitle = `🏅 Paris 2024`;
    if (medals.length > 0) {
      generateICS(medalsTitle, medalsKey, medals);
    }
  }

  private generateMainPage() {
    const accordionClass = "collapse collapse-arrow bg-gray-100 mb-1"
    const buttonClass = "btn btn-sm bg-gray-300 min-w-24 mb-1";

    const calendars: string[] = [];

    calendars.push(`<div class="${accordionClass}">`);
    calendars.push(`  <input type="radio" name="accordion" checked="checked">`);
    calendars.push(`  <div class="collapse-title text-xl font-medium">${translate.allSports.get(this.language)}</div>`);
    calendars.push(`  <div class="collapse-content text-center">`)
    calendars.push(`    <div>`);
    calendars.push(`      <button class="${buttonClass}" onclick="showModal('general/general', '${this.language}');">${translate.fullSchedule.get(this.language)}</button>`);
    calendars.push(`    </div>`);
    for (const noc of this.nocs.sort()) {
      calendars.push(`    <button class="${buttonClass}" onclick="showModal('general/${noc}', '${this.language}');">${getNOCFlag(noc)} ${noc}</button>`);
    }
    calendars.push(`  </div>`);
    calendars.push(`</div>`);

    calendars.push(`<div class="${accordionClass}">`);
    calendars.push(`  <input type="radio" name="accordion">`);
    calendars.push(`  <div class="collapse-title text-xl font-medium">🏅 ${translate.medalEvents.get(this.language)}</div>`);
    calendars.push(`  <div class="collapse-content text-center">`)
    calendars.push(`    <div>`);
    calendars.push(`      <button class="${buttonClass}" onclick="showModal('medals/general', '${this.language}');">${translate.fullSchedule.get(this.language)}</button>`);
    calendars.push(`    </div>`);
    for (const noc of this.nocs.sort()) {
      calendars.push(`    <button class="${buttonClass}" onclick="showModal('medals/${noc}', '${this.language}');">${getNOCFlag(noc)} ${noc}</button>`);
    }
    calendars.push(`  </div>`);
    calendars.push(`</div>`);

    calendars.push(`<div class="${accordionClass}">`);
    calendars.push(`  <input type="radio" name="accordion">`);
    calendars.push(`  <div class="collapse-title text-xl font-medium">📅 ${translate.todaysEvents.get(this.language)}</div>`);
    calendars.push(`  <div class="collapse-content text-center">`)
    for (const noc of this.nocs.sort()) {
      calendars.push(`    <a class="${buttonClass}" href="./today.html?noc=${noc}">${getNOCFlag(noc)} ${noc}</a>`);
    }
    calendars.push(`  </div>`);
    calendars.push(`</div>`);

    for (const sport of this.sports.sort()) {
      calendars.push(`<div class="${accordionClass}">`);
      calendars.push(`  <input type="radio" name="accordion">`);
      calendars.push(`  <div class="collapse-title text-xl font-medium">${getSportIcon(sport.key)} ${sport.name}</div>`);
      calendars.push(`  <div class="collapse-content text-center">`)
      calendars.push(`    <div>`);
      calendars.push(`      <button class="${buttonClass}" onclick="showModal('${sport.key}/general', '${this.language}');">${translate.fullSchedule.get(this.language)}</button>`);
      calendars.push(`      <button class="${buttonClass}" onclick="showModal('${sport.key}/medals', '${this.language}');">🏅 ${translate.medalEvents.get(this.language)}</button>`);
      calendars.push(`    </div>`);
      for (const noc of sport.NOCS.sort()) {
        calendars.push(`    <button class="${buttonClass}" onclick="showModal('${sport.key}/${noc}', '${this.language}');">${getNOCFlag(noc)} ${noc}</button>`);
      }
      calendars.push(`  </div>`);
      calendars.push(`</div>`);
    }

    const template = readFile(`${__dirname}/index/template.html`);
    const output = template
      .replace("{{calendars}}", calendars.join("\r\n"))
      .replace("{{title}}", translate.calendars.get(this.language)!)
      .replace("{{disclaimer}}", translate.disclaimer.get(this.language)!)
      ;
    saveFile(
      this.language === "en" ?
        "docs/index.html" :
        `docs/${this.language}/index.html`,
      output);
  }

  private generateTodaysPage() {
    const content: string[] = [];

    for (const event of this.events) {
      let sport = this.sports.find((sport) => sport.key === event._SPORT);
      if (!sport) {
        sport = {
          name: "Ceremony",
          key: "",
          NOCS: [],
        };
      }
      const summary = event.SUMMARY.match(/ceremony/gi) ? event.SUMMARY : event.SUMMARY.split(" ").slice(1).join(" ");

      content.push(`<div class="event py-4" data-start="${event.DTSTART}" data-end="${event.DTEND}" data-noc="${event._NOCS.join(",")}">`);
      content.push(" <div class=\"time w-1/4 align-top text-right inline-block text-5xl text-center tabular-nums pr-2 border-r border-slate-900/10\">__:__</div>");
      content.push(" <div class=\"w-3/5 align-top inline-block text-black pl-2\">");
      content.push("   <div class=\"text-2xl\">");
      content.push(`   ${event._MEDAL ? "🏅" : ""}`);
      content.push(`   ${sport.name.toUpperCase()}`);
      if (event._GENDER === "M") {
        content.push("   <span class=\"text-xs align-middle bg-blue-400 text-white py-1 px-2 rounded-xl\">M</span>");
      } else if (event._GENDER === "W") {
        content.push("   <span class=\"text-xs align-middle bg-pink-400 text-white py-1 px-2 rounded-xl\">W</span>");
      }
      content.push("   </div>");
      if (event._UNITNAME.match(summary)) {
        content.push(`   <div class="">${summary}`);
      } else {
        content.push(`   <div class="">${event._UNITNAME}`);
        content.push(`   <div class="">${summary}</div>`);
      }
      if (event._COMPETITORS) {
        event._COMPETITORS.forEach((competitor) => {
          content.push(`<div class= "competitor ${competitor.noc}"> ${competitor.name} </div>`);
        });
      }
      content.push("   </div>");
      content.push(" </div>");
      content.push("</div>");

    }

    const template = readFile(`${__dirname}/today/template.html`);
    const output = template
      .replace("{{events}}", content.join("\r\n"))
      .replace("{{title}}", translate.todaysEvents.get(this.language)!)
      .replace("{{disclaimer}}", translate.disclaimer.get(this.language)!)
      .replace("{{noEventToday}}", translate.noEventToday.get(this.language)!)
      ;
    saveFile(
      this.language === "en" ?
        "docs/today.html" :
        `docs/${this.language}/today.html`,
      output
    );
  }

  private generateCSS() {
    postcss([autoprefixer, tailwindcss])
      .process(readFile(`${__dirname}/index/template.css`), { from: "index/template.css", to: "docs/style.css" })
      .then((result) => {
        saveFile("docs/style.css", result.css);
      });
    ;
  }
}

