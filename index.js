const cheerio = require("cheerio");
const fs = require("fs");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const tailwindcss = require("tailwindcss");

const downloadSchedule = async (sportKey) => {
  const cacheFile = `${__dirname}/cache/${sportKey}.html`;

  if (!fs.existsSync(cacheFile)) {
    const response = await fetch(`https://olympics.com/en/paris-2024/schedule/${sportKey}`);
    const content = await response.text();
    fs.writeFileSync(cacheFile, content);
  }

  const html = fs.readFileSync(cacheFile, "utf-8");
  const $ = cheerio.load(html);
  return JSON.parse($("#__NEXT_DATA__").text());
};

const getSportIcon = (sport) => {
  const sports = {
    "3x3-basketball": "🏀③",
    "basketball": "🏀",
    "beach-volleyball": "🏐",
    "football": "⚽",
    "handball": "🤾",
    "hockey": "🏑",
    "rugby-sevens": "🏉",
    "volleyball": "🏐",
    "water-polo": "🤽",
  };

  if (sports[sport]) {
    return sports[sport];
  }
  throw new Error(`No icon set for ${sport}`);
};

const getCountryName = (code) => {
  const teams = {
    AFG: "Afghanistan",
    ALB: "Albania",
    ALG: "Algeria",
    ASA: "American Samoa",
    AND: "Andorra",
    ANG: "Angola",
    ANT: "Antigua and Barbuda",
    ARG: "Argentina",
    ARM: "Armenia",
    ARU: "Aruba",
    AUS: "Australia",
    AUT: "Austria",
    AZE: "Azerbaijan",
    BAH: "Bahamas",
    BRN: "Bahrain",
    BAN: "Bangladesh",
    BAR: "Barbados",
    BEL: "Belgium",
    BIZ: "Belize",
    BEN: "Benin",
    BER: "Bermuda",
    BHU: "Bhutan",
    BOL: "Bolivia",
    BIH: "Bosnia & Herzegovina",
    BOT: "Botswana",
    BRA: "Brazil",
    BRU: "Brunei Darussalam",
    BUL: "Bulgaria",
    BUR: "Burkina Faso",
    BDI: "Burundi",
    CPV: "Cabo Verde",
    CAM: "Cambodia",
    CMR: "Cameroon",
    CAN: "Canada",
    CAY: "Cayman Islands",
    CAF: "Centr Afric Rep",
    CHA: "Chad",
    CHI: "Chile",
    COL: "Colombia",
    COM: "Comoros",
    CGO: "Congo",
    COK: "Cook Islands",
    CRC: "Costa Rica",
    CIV: "Côte d'Ivoire",
    CRO: "Croatia",
    CUB: "Cuba",
    CYP: "Cyprus",
    CZE: "Czechia",
    PRK: "DPR Korea",
    COD: "DR Congo",
    TLS: "Timor-Leste",
    DEN: "Denmark",
    DJI: "Djibouti",
    DMA: "Dominica",
    DOM: "Dominican Republic",
    ECU: "Ecuador",
    EGY: "Egypt",
    ESA: "El Salvador",
    GEQ: "Equatorial Guinea",
    ERI: "Eritrea",
    EST: "Estonia",
    SWZ: "Eswatini",
    ETH: "Ethiopia",
    FSM: "Micronesia",
    FIJ: "Fiji",
    FIN: "Finland",
    FRA: "France",
    GAB: "Gabon",
    GAM: "Gambia",
    GEO: "Georgia",
    GER: "Germany",
    GHA: "Ghana",
    GBR: "Great Britain",
    GRE: "Greece",
    GRN: "Grenada",
    GUM: "Guam",
    GUA: "Guatemala",
    GUI: "Guinea",
    GBS: "Guinea-Bissau",
    GUY: "Guyana",
    HAI: "Haiti",
    HON: "Honduras",
    HKG: "Hong Kong, China",
    HUN: "Hungary",
    ISL: "Iceland",
    IND: "India",
    INA: "Indonesia",
    IRQ: "Iraq",
    IRL: "Ireland",
    IRI: "IR Iran",
    ISR: "Israel",
    ITA: "Italy",
    JAM: "Jamaica",
    JPN: "Japan",
    JOR: "Jordan",
    KAZ: "Kazakhstan",
    KEN: "Kenya",
    KIR: "Kiribati",
    KOS: "Kosovo",
    KUW: "Kuwait",
    KGZ: "Kyrgyzstan",
    LAO: "Lao PDR",
    LAT: "Latvia",
    LBN: "Lebanon",
    LES: "Lesotho",
    LBR: "Liberia",
    LBA: "Libya",
    LIE: "Liechtenstein",
    LTU: "Lithuania",
    LUX: "Luxembourg",
    MAD: "Madagascar",
    MAW: "Malawi",
    MAS: "Malaysia",
    MDV: "Maldives",
    MLI: "Mali",
    MLT: "Malta",
    MHL: "Marshall Islands",
    MTN: "Mauritania",
    MRI: "Mauritius",
    MEX: "Mexico",
    MON: "Monaco",
    MGL: "Mongolia",
    MNE: "Montenegro",
    MAR: "Morocco",
    MOZ: "Mozambique",
    MYA: "Myanmar",
    NAM: "Namibia",
    NRU: "Nauru",
    NEP: "Nepal",
    NED: "Netherlands",
    NZL: "New Zealand",
    NCA: "Nicaragua",
    NIG: "Niger",
    NGR: "Nigeria",
    MKD: "North Macedonia",
    NOR: "Norway",
    OMA: "Oman",
    PAK: "Pakistan",
    PLW: "Palau",
    PLE: "Palestine",
    PAN: "Panama",
    PNG: "Papua New Guinea",
    PAR: "Paraguay",
    CHN: "China",
    PER: "Peru",
    PHI: "Philippines",
    POL: "Poland",
    POR: "Portugal",
    PUR: "Puerto Rico",
    QAT: "Qatar",
    EOR: "EOR",
    KOR: "Korea",
    MDA: "Republic of Moldova",
    ROU: "Romania",
    RWA: "Rwanda",
    SKN: "St Kitts and Nevis",
    LCA: "Saint Lucia",
    SAM: "Samoa",
    SMR: "San Marino",
    STP: "Sao Tome & Principe",
    KSA: "Saudi Arabia",
    SEN: "Senegal",
    SRB: "Serbia",
    SEY: "Seychelles",
    SLE: "Sierra Leone",
    SGP: "Singapore",
    SVK: "Slovakia",
    SLO: "Slovenia",
    SOL: "Solomon Islands",
    SOM: "Somalia",
    RSA: "South Africa",
    SSD: "South Sudan",
    ESP: "Spain",
    SRI: "Sri Lanka",
    VIN: "StVincent&Grenadines",
    SUD: "Sudan",
    SUR: "Suriname",
    SWE: "Sweden",
    SUI: "Switzerland",
    SYR: "Syria",
    TJK: "Tajikistan",
    THA: "Thailand",
    TOG: "Togo",
    TGA: "Tonga",
    TPE: "Chinese Taipei",
    TTO: "Trinidad and Tobago",
    TUN: "Tunisia",
    TUR: "Türkiye",
    TKM: "Turkmenistan",
    TUV: "Tuvalu",
    UGA: "Uganda",
    UKR: "Ukraine",
    UAE: "UA Emirates",
    TAN: "Tanzania",
    USA: "United States",
    URU: "Uruguay",
    UZB: "Uzbekistan",
    VAN: "Vanuatu",
    VEN: "Venezuela",
    VIE: "Vietnam",
    IVB: "Virgin Islands, B",
    ISV: "Virgin Islands, US",
    YEM: "Yemen",
    ZAM: "Zambia",
    ZIM: "Zimbabwe",
  };

  if (teams[code]) {
    return teams[code];
  }
  throw new Error(`No name set for ${code}`);
};

const getCountryFlag = (code) => {
  const teams = {
    ANG: "🇦🇴",
    ARG: "🇦🇷",
    AUS: "🇦🇺",
    AUT: "🇦🇹",
    AZE: "🇦🇿",
    BEL: "🇧🇪",
    BRA: "🇧🇷",
    CAN: "🇨🇦",
    CHI: "🇨🇱",
    CHN: "🇨🇳",
    COL: "🇨🇴",
    CRO: "🇭🇷",
    CUB: "🇨🇺",
    CZE: "🇨🇿",
    DEN: "🇩🇰",
    DOM: "🇩🇴",
    EGY: "🇪🇬",
    ESP: "🇪🇸",
    FIJ: "🇫🇯",
    FRA: "🇫🇷",
    GBR: "🇬🇧",
    GER: "🇩🇪",
    GRE: "🇬🇷",
    GUI: "🇬🇳",
    HUN: "🇭🇺",
    IND: "🇮🇳",
    IRL: "🇮🇪",
    IRQ: "🇮🇶",
    ISR: "🇮🇱",
    ITA: "🇮🇹",
    JPN: "🇯🇵",
    KEN: "🇰🇪",
    KOR: "🇰🇷",
    LAT: "🇱🇻",
    LTU: "🇱🇹",
    MAR: "🇲🇦",
    MLI: "🇲🇱",
    MNE: "🇲🇪",
    NED: "🇳🇱",
    NGR: "🇳🇬",
    NOR: "🇳🇴",
    NZL: "🇳🇿",
    PAR: "🇵🇾",
    POL: "🇵🇱",
    PUR: "🇵🇷",
    QAT: "🇶🇦",
    ROU: "🇷🇴",
    RSA: "🇿🇦",
    SAM: "🇼🇸",
    SLO: "🇸🇮",
    SRB: "🇷🇸",
    SSD: "🇸🇸",
    SUI: "🇨🇭",
    SWE: "🇸🇪",
    TUR: "🇹🇷",
    UKR: "🇺🇦",
    URU: "🇺🇾",
    USA: "🇺🇸",
    UZB: "🇺🇿",
    ZAM: "🇿🇲",
  };

  if (teams[code]) {
    return teams[code];
  }
  throw new Error(`No flag set for ${code} (${getCountryName(code)})`);
};

const SPORTS = [];
const TEAMS = [];
const EVENTS = [];

const OUTPUT = [];

const generateCalendar = (title, key, events) => {
  const lines = [];
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
        .map(([key, value]) => `${key}:${value}`),
    );
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

  const folder = `${__dirname}/docs/${key}.ics`.split("/").slice(0, -1).join("/");
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(`${__dirname}/docs/${key}.ics`, lines.join("\r\n"));
};

const generateSportCalendar = (sportKey) => {
  const sport = SPORTS.find((sport) => sport.key === sportKey);
  const events = EVENTS
    .filter((event) => event._SPORT === sport.key)
    .sort((a, b) => a.UID > b.UID ? 1 : -1);;
  const key = `${sportKey}/general`;
  const title = `${sport.icon} ${sport.name} | Paris 2024`;

  generateCalendar(title, key, events);
  OUTPUT.push(`
    <div class="flex items-center pb-4 pt-8">
      <div class="text-3xl">
        <a href="${key}.ics">${sport.icon} ${sport.name}</a>
      </div>
      <div class="bg-gray-200 hover:bg-blue-200 px-2 py-1 ml-4 rounded-lg text-base">
        <a href="${key}.ics">Full schedule</a>
      </div>
    </div>
  `);
};

const generateSportTeamCalendar = (sportKey, teamKey) => {
  const sport = SPORTS.find((sport) => sport.key === sportKey);
  const team = TEAMS.find((team) => team.key === teamKey);
  const events = EVENTS
    .filter((event) => event._SPORT === sport.key && (event._TEAM1 === team.key || event._TEAM2 === team.key))
    .sort((a, b) => a.UID > b.UID ? 1 : -1);
  const key = `${sportKey}/${teamKey}`;
  const title = `${team.icon} ${team.name} ${sport.name} | Paris 2024`;

  generateCalendar(title, key, events);
  OUTPUT.push(`
    <li class="inline-block bg-gray-200 hover:bg-blue-200 px-2 py-1 mb-2 rounded-lg">
      <a href="${key}.ics">
        ${team.icon} ${team.key}
      </a>
    </li>
  `);
};

const generateTeamCalendar = (teamKey) => {
  const team = TEAMS.find((team) => team.key === teamKey);
  const events = EVENTS
    .filter((event) => event._TEAM1 === team.key || event._TEAM2 === team.key)
    .sort((a, b) => a.UID > b.UID ? 1 : -1);
  const key = `general/${teamKey}`;
  const title = `${team.icon} ${team.name} | Paris 2024`;

  generateCalendar(title, key, events);
  OUTPUT.push(`
    <li class="inline-block bg-gray-200 hover:bg-blue-200 px-2 py-1 mb-2 rounded-lg">
      <a href="${key}.ics">
        ${team.icon} ${team.key}
      </a>
    </li>
  `);
};

const addSport = (name, key, icon) => {
  if (!SPORTS.find((sport) => sport.key === key)) {
    SPORTS.push({ name, key, icon, teams: [] });
  }
};

const addTeam = (key) => {
  if (!TEAMS.find((team) => team.key === key)) {
    TEAMS.push({
      key,
      name: getCountryName(key),
      icon: getCountryFlag(key),
    });
  }
};

const addSportTeam = (sportKey, teamKey) => {
  const sport = SPORTS.find((sport) => sport.key === sportKey);
  if (sport && !sport.teams.includes(teamKey)) {
    sport.teams.push(teamKey);
  }
};

const isValidTeam = (team) => !team.match(/winner|loser|[0-9]/gi);

const teamSport = async (sportKey) => {
  const data = await downloadSchedule(sportKey);
  const sportName = data.query.pDisciplineLabel;
  const sportIcon = getSportIcon(sportKey);

  addSport(sportName, sportKey, sportIcon);

  data.props.pageProps.scheduleDataSource.initialSchedule.units.forEach(unit => {

    unit.startDateTimeUtc = new Date(unit.startDate).toISOString().replace(".000", "");
    unit.endDateTimeUtc = new Date(unit.endDate).toISOString().replace(".000", "");

    const event = {
      UID: `${sportKey}-${unit.startDateTimeUtc.replace(/[:-]/g, "")}`,
      DTSTAMP: unit.startDateTimeUtc.replace(/[:-]/g, ""),
      DTSTART: unit.startDateTimeUtc.replace(/[:-]/g, ""),
      DTEND: unit.endDateTimeUtc.replace(/[:-]/g, ""),
      DESCRIPTION: `${sportName} - ${unit.eventUnitName}`,
      SUMMARY: `${sportIcon} ${unit.eventUnitName}`,
      LOCATION: unit.venueDescription,
      _SPORT: sportKey,
    };

    if (unit.competitors && unit.competitors.length === 2 &&
      isValidTeam(unit.competitors[0].name) &&
      isValidTeam(unit.competitors[1].name)
    ) {
      const competitors = unit.competitors.sort((a, b) => a.order > b.order ? 1 : -1);
      const team1 = {
        name: competitors[0].name,
        key: competitors[0].noc,
        icon: getCountryFlag(competitors[0].noc),
      };
      addTeam(team1.key);

      const team2 = {
        name: competitors[1].name,
        key: competitors[1].noc,
        icon: getCountryFlag(competitors[1].noc),
      };
      addTeam(team2.key);

      event.UID += `-${team1.key}-${team2.key}`;
      if (team1.name !== getCountryName(team1.key)) {
        event.SUMMARY = `${sportIcon} ${team1.name} ${team1.icon} - ${team2.icon} ${team2.name}`;
      } else {
        event.SUMMARY = `${sportIcon} ${team1.key} ${team1.icon} - ${team2.icon} ${team2.key}`;
      }
      event._TEAM1 = team1.key;
      event._TEAM2 = team2.key;
      addSportTeam(sportKey, team1.key);
      addSportTeam(sportKey, team2.key);
    }

    EVENTS.push(event);

  });
};

const teamSports = async () => {
  await Promise.all(
    [
      "3x3-basketball",
      "basketball",
      "beach-volleyball",
      "football",
      "handball",
      "hockey",
      "rugby-sevens",
      "volleyball",
      "water-polo",
    ]
      .map((key) => teamSport(key)),
  );

  SPORTS.sort((a, b) => a.name > b.name ? 1 : -1)
    .forEach((sport) => {
      const sportKey = sport.key;
      generateSportCalendar(sportKey);
      OUTPUT.push("<ul>");
      sport.teams
        .sort((a, b) => a > b ? 1 : -1)
        .forEach((teamKey) => {
          generateSportTeamCalendar(sportKey, teamKey);
        });
      OUTPUT.push("</ul>");
    });

  OUTPUT.push("<div class=\"text-3xl pb-4 pt-8\">🌍 Teams</div>");
  TEAMS
    .sort((a, b) => a.name > b.name ? 1 : -1)
    .forEach((team) => {
      generateTeamCalendar(team.key);
    });
};

const main = async () => {
  await teamSports();

  const template = fs.readFileSync(`${__dirname}/template.html`, "utf-8");
  const output = template.replace("{{calendars}}", OUTPUT.join("\n"));
  fs.writeFileSync("docs/index.html", output);

  postcss([autoprefixer, tailwindcss])
    .process(fs.readFileSync(`${__dirname}/template.css`, "utf-8"), { from: "template.css", to: "docs/style.css" })
    .then((result) => {
      fs.writeFileSync("docs/style.css", result.css);
    });
};


main();
