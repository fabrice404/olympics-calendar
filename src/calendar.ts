import Debug from "debug";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwindcss from "tailwindcss";

import { Event, Medal, NOC, Sport } from "./types";
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
  private medals: Medal[] = [];

  constructor(language: string) {
    this.language = language;
    this.debug = Debug(`paris2024:calendar:${language}`);
  }

  private addSport(sportKey: string, sportName: string) {
    if (!this.sports.find(sport => sport.key === sportKey)) {
      // this.debug(`Adding sport: ${sportName} (${sportKey})`);
      this.sports.push({
        key: sportKey,
        name: sportName,
        NOCS: [],
      });
    }
  }

  private addNOC(noc: string) {
    if (!this.nocs.includes(noc)) {
      // this.debug(`Adding NOC: ${noc}`);
      this.nocs.push(noc);
    }
  }

  private addSportNOC(sportKey: string, sportName: string, noc: string) {
    this.addSport(sportKey, sportName);
    const sport = this.sports.find((sport) => sport.key === sportKey)!;
    if (!sport.NOCS.includes(noc)) {
      // this.debug(`Adding NOC: ${noc} to sport: ${sportKey}`);
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
    this.genereateMedalsPage();

    this.generateCSS();
  }

  private async getSportCalendar(sportKey: string) {
    const schedule = await this.downloadScheduleFromOfficialWebsite(sportKey);
    this.generateEventsFromSchedule(sportKey, schedule);
  }

  private async downloadScheduleFromOfficialWebsite(sportKey: string) {
    // this.debug(`Checking cache for schedule for ${sportKey}`);
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

        for (const competitor of competitors) {
          this.addSportNOC(sportKey, sportName, competitor.noc);
          this.addNOC(competitor.noc);
          event._COMPETITORS.push({ noc: competitor.noc, name: competitor.name });
          if (!event._NOCS.includes(competitor.noc)) {
            event._NOCS.push(competitor.noc);
          }
          switch (competitor.results?.medalType) {
            case "ME_GOLD": this.medals.push({ name: competitor.name, noc: competitor.noc, sport: sportName, unit: unit.eventUnitName, date: unit.endDateTimeUtc, color: "gold" }); break;
            case "ME_SILVER": this.medals.push({ name: competitor.name, noc: competitor.noc, sport: sportName, unit: unit.eventUnitName, date: unit.endDateTimeUtc, color: "silver" }); break;
            case "ME_BRONZE": this.medals.push({ name: competitor.name, noc: competitor.noc, sport: sportName, unit: unit.eventUnitName, date: unit.endDateTimeUtc, color: "bronze" }); break;
          }
        }

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
      DESCRIPTION: `Paris 2024 - {{translate_openingCeremony}}`,
      SUMMARY: `Paris 2024 - {{translate_openingCeremon}}`,
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

  private sortEvents(a: Event, b: Event) {
    if (a.DTSTART !== b.DTSTART) {
      return a.DTSTART > b.DTSTART ? 1 : -1;
    }
    if (a.DTEND !== b.DTEND) {
      return a.DTEND > b.DTEND ? 1 : -1;
    }
    if (a.SUMMARY !== b.SUMMARY) {
      return a.SUMMARY > b.SUMMARY ? 1 : -1;
    }
    if (a.DESCRIPTION !== b.DESCRIPTION) {
      return a.DESCRIPTION > b.DESCRIPTION ? 1 : -1;
    }
    return 0;
  }

  private generateCalendars() {
    // sports
    for (const sport of this.sports) {
      // sport/general
      let events = this.events
        .filter((event) => event._SPORT === sport.key)
        .sort(this.sortEvents);
      let key = this.getKey(sport.key, "general");
      let title = `${getSportIcon(sport.key)} ${sport.name} | Paris 2024`;
      if (events.length > 0) {
        generateICS(title, key, events);
      }

      // sport/medals
      events = this.events
        .filter((event) => event._SPORT === sport.key && event._MEDAL)
        .sort(this.sortEvents);
      key = this.getKey(sport.key, "medals");
      title = `${getSportIcon(sport.key)} ${sport.name} 🏅 | Paris 2024`;
      if (events.length > 0) {
        generateICS(title, key, events);
      }

      // sport/noc
      for (const noc of sport.NOCS) {
        events = this.events
          .filter((event) => event._SPORT === sport.key && event._NOCS.includes(noc))
          .sort(this.sortEvents);
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
        .sort(this.sortEvents);
      let key = this.getKey("general", noc);
      let title = `${getNOCFlag(noc)} ${getNOCName(noc)} | Paris 2024`;
      if (events.length > 0) {
        generateICS(title, key, events);
      }

      // medals/noc
      events = this.events
        .filter((event) => event._NOCS.includes(noc) && event._MEDAL)
        .sort(this.sortEvents);
      key = this.getKey("medals", noc);
      title = `${getNOCFlag(noc)} ${getNOCName(noc)} 🏅 | Paris 2024`
      if (events.length > 0) {
        generateICS(title, key, events);
      }
    }

    // general/general
    const events = this.events
      .sort(this.sortEvents);
    const key = this.getKey("general", "general");
    const title = `Paris 2024`;
    if (events.length > 0) {
      generateICS(title, key, events);
    }

    // medals/general
    const medals = this.events
      .filter((event) => event._MEDAL)
      .sort(this.sortEvents);
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
    calendars.push(`  <div class="collapse-title text-xl font-medium">{{translate_allSports}}</div>`);
    calendars.push(`  <div class="collapse-content text-center">`)
    calendars.push(`    <div>`);
    calendars.push(`      <button class="${buttonClass}" onclick="showModal('general/general', '${this.language}');">{{translate_fullSchedule}}</button>`);
    calendars.push(`    </div>`);
    for (const noc of this.nocs.sort()) {
      calendars.push(`    <button class="${buttonClass}" onclick="showModal('general/${noc}', '${this.language}');">${getNOCFlag(noc)} ${noc}</button>`);
    }
    calendars.push(`  </div>`);
    calendars.push(`</div>`);

    calendars.push(`<div class="${accordionClass}">`);
    calendars.push(`  <input type="radio" name="accordion">`);
    calendars.push(`  <div class="collapse-title text-xl font-medium">🏅 {{translate_medalEvents}}</div>`);
    calendars.push(`  <div class="collapse-content text-center">`)
    calendars.push(`    <div>`);
    calendars.push(`      <button class="${buttonClass}" onclick="showModal('medals/general', '${this.language}');">{{translate_fullSchedule}}</button>`);
    calendars.push(`    </div>`);
    for (const noc of this.nocs.sort()) {
      calendars.push(`    <button class="${buttonClass}" onclick="showModal('medals/${noc}', '${this.language}');">${getNOCFlag(noc)} ${noc}</button>`);
    }
    calendars.push(`  </div>`);
    calendars.push(`</div>`);

    calendars.push(`<div class="${accordionClass}">`);
    calendars.push(`  <input type="radio" name="accordion">`);
    calendars.push(`  <div class="collapse-title text-xl font-medium">📅 {{translate_todaysEvents}}</div>`);
    calendars.push(`  <div class="collapse-content text-center">`)
    for (const noc of this.nocs.sort()) {
      calendars.push(`    <a class="${buttonClass}" href="./today.html?noc=${noc}">${getNOCFlag(noc)} ${noc}</a>`);
    }
    calendars.push(`  </div>`);
    calendars.push(`</div>`);

    for (const sport of this.sports.sort((a: Sport, b: Sport) => a.name > b.name ? 1 : -1)) {
      calendars.push(`<div class="${accordionClass}">`);
      calendars.push(`  <input type="radio" name="accordion">`);
      calendars.push(`  <div class="collapse-title text-xl font-medium">${getSportIcon(sport.key)} ${sport.name}</div>`);
      calendars.push(`  <div class="collapse-content text-center">`)
      calendars.push(`    <div>`);
      calendars.push(`      <button class="${buttonClass}" onclick="showModal('${sport.key}/general', '${this.language}');">{{translate_fullSchedule}}</button>`);
      calendars.push(`      <button class="${buttonClass}" onclick="showModal('${sport.key}/medals', '${this.language}');">🏅 {{translate_medalEvents}}</button>`);
      calendars.push(`    </div>`);
      for (const noc of sport.NOCS.sort()) {
        calendars.push(`    <button class="${buttonClass}" onclick="showModal('${sport.key}/${noc}', '${this.language}');">${getNOCFlag(noc)} ${noc}</button>`);
      }
      calendars.push(`  </div>`);
      calendars.push(`</div>`);
    }

    const template = readFile(`${__dirname}/index/template.html`);
    const output = translate.translate(
      template.replace("{{calendars}}", calendars.join("\r\n")),
      this.language,
    );
    saveFile(
      this.language === "en" ?
        "docs/index.html" :
        `docs/${this.language}/index.html`,
      output);
  }

  private generateTodaysPage() {
    const content: string[] = [];

    for (const event of this.events.sort(this.sortEvents)) {
      let sport = this.sports.find((sport) => sport.key === event._SPORT);
      if (!sport) {
        sport = {
          name: "Ceremony",
          key: "",
          NOCS: [],
        };
      }

      content.push(`<div class="event py-4" data-start="${event.DTSTART}" data-end="${event.DTEND}" data-noc="${event._NOCS.sort().join(",")}">`);
      content.push(" <div class=\"time w-1/4 align-top text-right inline-block text-5xl text-center tabular-nums pr-2 border-r border-slate-900/10\">");
      content.push("  <span class=\"time-start\">__:__</span>");
      content.push("  <div class=\"time-end text-xs\">__:__</div>");
      content.push(" </div>");
      content.push(" <div class=\"w-3/5 align-top inline-block text-black pl-2\">");
      content.push("   <div class=\"text-2xl\">");
      content.push(`   ${event._MEDAL ? "🏅" : ""}`);
      content.push(`   ${sport.name.toUpperCase()}`);
      if (event._GENDER === "M") {
        content.push(`   <span class=\"text-xs align-middle bg-blue-400 text-white py-1 px-2 rounded-xl\">{{translate_genderMen}}</span>`);
      } else if (event._GENDER === "W") {
        content.push(`   <span class=\"text-xs align-middle bg-pink-400 text-white py-1 px-2 rounded-xl\">{{translate_genderWomen}}</span>`);
      }
      content.push("   </div>");
      content.push(`   <div>${event._UNITNAME}</div>`);
      if (event._COMPETITORS) {
        if (event._COMPETITORS.length === 2) {
          content.push(`    <div class="competitors">`);
          content.push(`      ${event._COMPETITORS[0].name}`);
          content.push(`      ${getNOCFlag(event._COMPETITORS[0].noc)}`);
          content.push(`      -`);
          content.push(`      ${getNOCFlag(event._COMPETITORS[1].noc)}`);
          content.push(`      ${event._COMPETITORS[1].name}`);
          content.push(`    </div>`);
        } else {
          event._COMPETITORS.sort((a, b) => a.name > b.name ? 1 : -1).forEach((competitor) => {
            content.push(`    <div class="competitor ${competitor.noc}">${getNOCFlag(competitor.noc)} ${competitor.name} </div>`);
          });
        }
      }
      content.push(" </div>");
      content.push("</div>");

    }

    const template = readFile(`${__dirname}/today/template.html`);
    const output = translate.translate(
      template.replace("{{events}}", content.join("\r\n")),
      this.language,
    );
    saveFile(
      this.language === "en" ?
        "docs/today.html" :
        `docs/${this.language}/today.html`,
      output
    );
  }

  private genereateMedalsPage() {
    const table: any[] = [];
    for (const medal of this.medals) {
      if (!table.find((noc) => noc.noc === medal.noc)) {
        table.push({ noc: medal.noc, gold: 0, silver: 0, bronze: 0 });
      }
      table.find((noc) => noc.noc === medal.noc)[medal.color] += 1;
    }

    const content: string[] = [];
    content.push(`<div class="collapse bg-gray-100 mb-1">`);
    content.push(`  <div class="flex collapse-title text-xl font-medium">`);
    content.push(`    <span class="inline-block flex-auto"></span>`);
    content.push(`    <span class="inline-block text-center w-1/6 flex-none gold">&#9679;</span>`);
    content.push(`    <span class="inline-block text-center w-1/6 flex-none silver">&#9679;</span>`);
    content.push(`    <span class="inline-block text-center w-1/6 flex-none bronze">&#9679;</span>`);
    content.push(`    <span class="inline-block text-center w-1/6 flex-none">TOTAL</span>`);
    content.push(`  </div>`);
    content.push(`</div>`);

    table.sort((a, b) => {
      if (a.gold !== b.gold) {
        return a.gold < b.gold ? 1 : -1;
      }
      if (a.silver !== b.silver) {
        return a.silver < b.silver ? 1 : -1;
      }
      if (a.bronze !== b.bronze) {
        return a.bronze < b.bronze ? 1 : -1;
      }
      return a.name > b.name ? 1 : -1;
    }).forEach((noc) => {
      content.push(`<div class="collapse collapse-arrow bg-gray-100 mb-1">`);
      content.push(`  <input type="radio" name="accordion">`);
      content.push(`  <div class="flex collapse-title text-xl font-medium">`);
      content.push(`    <span class="inline-block flex-auto">${getNOCFlag(noc.noc)} ${getNOCName(noc.noc)}</span>`);
      content.push(`    <span class="inline-block text-center w-1/6 flex-none">${noc.gold}</span>`);
      content.push(`    <span class="inline-block text-center w-1/6 flex-none">${noc.silver}</span>`);
      content.push(`    <span class="inline-block text-center w-1/6 flex-none">${noc.bronze}</span>`);
      content.push(`    <span class="inline-block text-center w-1/6 flex-none">${noc.gold + noc.silver + noc.bronze}</span>`);
      content.push(`  </div>`);
      content.push(`  <div class="collapse-content">`)
      content.push(`  <table class="table-full">`);

      let lastDate = "";
      for (const medal of this.medals.filter((m) => m.noc === noc.noc).sort((a, b) => a.date > b.date ? -1 : 1)) {
        let medalDate = medal.date.substring(0, 10);
        if (medalDate !== lastDate) {
          content.push(`    <tr><td colspan="3" class="font-medium">${medalDate}</td></tr>`);
        }
        lastDate = medalDate;

        content.push(`    <tr>`);
        content.push(`      <td class="${medal.color}">&#9679;</td>`);
        content.push(`      <td>${medal.name}</td>`);
        content.push(`      <td>${medal.sport} - ${medal.unit}</td>`);
        content.push(`    </tr>`);
      }
      content.push(`  </table>`);
      content.push(`  </div>`);
      content.push(`</div>`);
    })

    const template = readFile(`${__dirname}/medals/template.html`);
    const output = translate.translate(
      template.replace("{{medals}}", content.join("\r\n")),
      this.language,
    );
    saveFile(
      this.language === "en" ?
        "docs/medals.html" :
        `docs/${this.language}/medals.html`,
      output
    );
  }

  private generateCSS() {
    postcss([autoprefixer, tailwindcss])
      .process(readFile(`${__dirname}/index/template.css`), { from: "index/template.css", to: "docs/main.css" })
      .then((result) => {
        saveFile("docs/main.css", result.css);
      });
    ;
  }
}

