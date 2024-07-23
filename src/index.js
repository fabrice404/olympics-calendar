const cheerio = require("cheerio");
const fs = require("fs");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");

const { getSportIcon } = require("./sports");
const { isValidNOC, getNOCName, getNOCFlag } = require("./nocs");
const { generateICS } = require("./ics");

const downloadSchedule = async (sportKey) => {
  const cacheFile = `${__dirname}/../cache/${sportKey}.html`;

  if (!fs.existsSync(cacheFile)) {
    const response = await fetch(`https://olympics.com/en/paris-2024/schedule/${sportKey}`);
    const content = await response.text();
    fs.writeFileSync(cacheFile, content);
  }

  const html = fs.readFileSync(cacheFile, "utf-8");
  const $ = cheerio.load(html);
  return JSON.parse($("#__NEXT_DATA__").text());
};

const EVENTS = [];
const NOCS = [];
const SPORTS = [];

const addNOC = (noc) => {
  if (!NOCS.includes(noc)) {
    NOCS.push(noc);
  }
};

const addSport = (sportKey, sportName) => {
  if (!SPORTS.find((sport) => sport.key === sportKey)) {
    SPORTS.push({ key: sportKey, name: sportName, NOCS: [] });
  }
};

const addSportNOC = (sportKey, sportName, noc) => {
  addSport(sportKey, sportName);
  const sport = SPORTS.find((sport) => sport.key === sportKey);
  if (!sport.NOCS.includes(noc)) {
    sport.NOCS.push(noc);
  }
};

const generateCalendars = () => {
  SPORTS
    .sort((a, b) => a.name > b.name ? 1 : -1)
    .forEach((sport) => {
      let events = EVENTS
        .filter((event) => event._SPORT === sport.key)
        .sort((a, b) => a.UID > b.UID ? 1 : -1);
      let key = `${sport.key}/general`;
      let title = `${getSportIcon(sport.key)} ${sport.name} | Paris 2024`;
      generateICS(title, key, events);

      sport.NOCS.forEach((noc) => {
        events = EVENTS
          .filter((event) => event._SPORT === sport.key && event._NOCS.includes(noc))
          .sort((a, b) => a.UID > b.UID ? 1 : -1);
        key = `${sport.key}/${noc}`;
        title = `${getNOCFlag(noc)} ${getNOCName(noc)} ${sport.name} | Paris 2024`;
        generateICS(title, key, events);
      });
    });

  NOCS.sort()
    .forEach((noc) => {
      const events = EVENTS
        .filter((event) => event._NOCS.includes(noc))
        .sort((a, b) => a.UID > b.UID ? 1 : -1);
      const key = `general/${noc}`;
      const title = `${getNOCFlag(noc)} ${getNOCName(noc)} | Paris 2024`;
      generateICS(title, key, events);
    });

  const events = EVENTS
    .sort((a, b) => a.UID > b.UID ? 1 : -1);
  const key = "general/general";
  const title = "Paris 2024";
  generateICS(title, key, events);
};

const slugify = (text) => text.toLowerCase().replace(/\s/g, "-")
  .replace(/[^a-z0-9-]/g, "")
  .replace(/-+/g, "-");

const extractSportCalendar = async (sportKey) => {
  const data = await downloadSchedule(sportKey);
  const sportName = data.query.pDisciplineLabel;
  const sportIcon = getSportIcon(sportKey);
  addSport(sportKey, sportName);

  data.props.pageProps.scheduleDataSource.initialSchedule.units.forEach(unit => {
    unit.startDateTimeUtc = new Date(unit.startDate).toISOString().replace(".000", "");
    unit.endDateTimeUtc = new Date(unit.endDate).toISOString().replace(".000", "");

    const event = {
      UID: `${sportKey}-${unit.startDateTimeUtc.replace(/[:-]/g, "")}-${slugify(unit.eventUnitName).toUpperCase()}`,
      DTSTAMP: unit.startDateTimeUtc.replace(/[:-]/g, ""),
      DTSTART: unit.startDateTimeUtc.replace(/[:-]/g, ""),
      DTEND: unit.endDateTimeUtc.replace(/[:-]/g, ""),
      DESCRIPTION: `${sportName} - ${unit.eventUnitName}`,
      SUMMARY: `${sportIcon} ${unit.eventUnitName}`.trim(),
      LOCATION: unit.venueDescription,
      _SPORT: sportKey,
      _NOCS: [],
    };

    if (unit.competitors) {
      const competitors = unit.competitors
        .filter((competitor) => competitor.noc && isValidNOC(competitor.noc))
        .sort((a, b) => a.order > b.order ? 1 : -1);
      event._NOCS = competitors.map((competitor) => {
        addSportNOC(sportKey, sportName, competitor.noc);
        addNOC(competitor.noc);
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
      } else {
        // more than two, we put them in the description
        competitors.forEach((competitor) => {
          if (competitor.name !== getNOCName(competitor.noc)) {
            event.DESCRIPTION += `\r\n${getNOCFlag(competitor.noc)} ${competitor.name}`;
          } else {
            event.DESCRIPTION += `\r\n${getNOCFlag(competitor.noc)} ${competitor.noc}`;
          }
        });
      }
    }
    EVENTS.push(event);
  });
};

const generateOutputPage = () => {
  const html = [];

  const linkClass = "inline-block bg-slate-400 hover:bg-blue-400 text-white px-2 py-1 my-px rounded-lg text-base";

  html.push("<table>");
  SPORTS.map((sport) => {
    html.push("<tr class=\"even:bg-slate-200\">");
    html.push(`<th class="font-bold text-left whitespace-nowrap">${getSportIcon(sport.key)} ${sport.name}</td>`);
    html.push("<td>");
    html.push(`<a href="${sport.key}/general.ics" class="${linkClass}">Full schedule</a>`);
    sport.NOCS.sort().forEach((noc) => {
      html.push(`<a href="${sport.key}/${noc}.ics" class="${linkClass}">${getNOCFlag(noc)} ${noc}</a>`);
    });
    html.push("</td>");
    html.push("</tr>");
  });

  html.push("<tr class=\"even:bg-slate-200\">");
  html.push("<th class=\"font-bold text-left whitespace-nowrap\">All sports</td>");
  html.push("<td>");
  html.push(`<a href="general/general.ics" class="${linkClass}">Full schedule</a>`);
  NOCS.sort().forEach((noc) => {
    html.push(`<a href="general/${noc}.ics" class="${linkClass}">${getNOCFlag(noc)} ${noc}</a>`);
  });
  html.push("</tr>");
  html.push("</table>");

  const template = fs.readFileSync(`${__dirname}/template.html`, "utf-8");
  const output = template.replace("{{calendars}}", html.join("\r\n"));
  fs.writeFileSync("docs/index.html", output);

  postcss([autoprefixer, tailwindcss])
    .process(fs.readFileSync(`${__dirname}/template.css`, "utf-8"), { from: "template.css", to: "docs/style.css" })
    .then((result) => {
      fs.writeFileSync("docs/style.css", result.css);
    });
  ;
};

const main = async () => {
  await Promise.all(
    [
      "3x3-basketball",
      "archery",
      "artistic-gymnastics",
      "artistic-swimming",
      "athletics",
      "badminton",
      "basketball",
      "beach-volleyball",
      "boxing",
      "breaking",
      "canoe-slalom",
      "canoe-sprint",
      "cycling-bmx-freestyle",
      "cycling-bmx-racing",
      "cycling-mountain-bike",
      "cycling-road",
      "cycling-track",
      "diving",
      "equestrian",
      "fencing",
      "football",
      "golf",
      "handball",
      "hockey",
      "judo",
      "marathon-swimming",
      "modern-pentathlon",
      "rhythmic-gymnastics",
      "rowing",
      "rugby-sevens",
      "sailing",
      "shooting",
      "skateboarding",
      "sport-climbing",
      "surfing",
      "swimming",
      "table-tennis",
      "taekwondo",
      "tennis",
      "trampoline-gymnastics",
      "triathlon",
      "volleyball",
      "water-polo",
      "weightlifting",
      "wrestling",
    ]
      .map((key) => extractSportCalendar(key)),
  );
  generateCalendars();
  generateOutputPage();
};

main();
