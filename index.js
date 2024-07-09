const cheerio = require('cheerio');
const fs = require('fs');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');

const downloadSchedule = async (sportKey) => {
  const cacheFile = `${__dirname}/cache/${sportKey}.html`;

  if (!fs.existsSync(cacheFile)) {
    const response = await fetch(`https://olympics.com/en/paris-2024/schedule/${sportKey}`);
    const content = await response.text();
    fs.writeFileSync(cacheFile, content);
  }

  const html = fs.readFileSync(cacheFile, 'utf-8');
  const $ = cheerio.load(html);
  return JSON.parse($('#__NEXT_DATA__').text());
};

const getSportIcon = (sport) => {
  switch (sport.toLowerCase()) {
    case "3x3-basketball": return "🏀③"
    case "basketball": return "🏀";
    case "football": return "⚽";
    case "handball": return "🤾";
    case "hockey": return "🏑";
    case "rugby-sevens": return "🏉";
    case "volleyball": return "🏐";
    case "water-polo": return "🤽";
    default: throw new Error(`No icon set for ${sport}`);
  }
};

const getFlagIcon = (country) => {
  if (country.toLowerCase().startsWith("winner oqt")) {
    return "🏳️";
  }
  switch (country.toLowerCase()) {
    case "angola": return "🇦🇴";
    case "argentina": return "🇦🇷";
    case "australia": return "🇦🇺";
    case "azerbaijan": return "🇦🇿";
    case "belgium": return "🇧🇪";
    case "brazil": return "🇧🇷";
    case "canada": return "🇨🇦";
    case "china": return "🇨🇳";
    case "colombia": return "🇨🇴";
    case "croatia": return "🇭🇷";
    case "denmark": return "🇩🇰";
    case "dominican republic": return "🇩🇴";
    case "fiji": return "🇫🇯";
    case "france": return "🇫🇷";
    case "egypt": return "🇪🇬";
    case "germany": return "🇩🇪";
    case "great britain": return "🇬🇧";
    case "greece": return "🇬🇷";
    case "guinea": return "🇬🇳";
    case "hungary": return "🇭🇺";
    case "india": return "🇮🇳";
    case "iraq": return "🇮🇶";
    case "ireland": return "🇮🇪";
    case "israel": return "🇮🇱";
    case "italy": return "🇮🇱";
    case "japan": return "🇯🇵";
    case "kenya": return "🇰🇪";
    case "latvia": return "🇱🇻";
    case "lithuania": return "🇱🇹";
    case "korea": return "🇰🇷";
    case "mali": return "🇲🇱";
    case "montenegro": return "🇲🇪";
    case "morocco": return "🇲🇦";
    case "nigeria": return "🇳🇬";
    case "netherlands": return "🇳🇱";
    case "new zealand": return "🇳🇿";
    case "norway": return "🇳🇴";
    case "paraguay": return "🇵🇾";
    case "poland": return "🇵🇱";
    case "puerto rico": return "🇵🇷";
    case "romania": return "🇷🇴";
    case "serbia": return "🇷🇸";
    case "south africa": return "🇿🇦";
    case "south sudan": return "🇸🇸";
    case "slovenia": return "🇸🇮";
    case "samoa": return "🇼🇸";
    case "spain": return "🇪🇸";
    case "sweden": return "🇸🇪";
    case "türkiye": return "🇹🇷";
    case "ukraine": return "🇺🇦";
    case "united states": return "🇺🇸";
    case "uruguay": return "🇺🇾";
    case "uzbekistan": return "🇺🇿";
    case "zambia": return "🇿🇲";
    default: throw new Error(`No flag set for ${country}`);
  }
}

const SPORTS = [];
const TEAMS = [];
const EVENTS = [];

const OUTPUT = [];

const generateCalendar = (title, key, events) => {
  const lines = [];
  lines.push(`BEGIN:VCALENDAR`);
  lines.push(`VERSION:2.0`);
  lines.push(`PRODID:-//fabrice404//olympics-calendar//${key}//EN`);
  lines.push(`X-WR-CALNAME:${title}`);
  lines.push(`NAME:${title}`);

  events.forEach((event) => {
    lines.push(`BEGIN:VEVENT`);
    lines.push(
      ...Object.entries(event)
        .filter(([key, value]) => !key.startsWith('_'))
        .map(([key, value]) => `${key}:${value}`)
    );
    lines.push(`END:VEVENT`);
  });

  lines.push(`END:VCALENDAR`);

  const folder = `${__dirname}/docs/${key}.ics`.split('/').slice(0, -1).join('/');
  fs.mkdirSync(folder, { recursive: true })
  fs.writeFileSync(`${__dirname}/docs/${key}.ics`, lines.join('\r\n'));
}

const generateSportCalendar = (sportKey) => {
  const sport = SPORTS.find((sport) => sport.key === sportKey);
  const events = EVENTS.filter((event) => event._SPORT === sport.key);
  const key = `${sportKey}/general`;
  const title = `${sport.icon} ${sport.name} | Paris 2024`;

  generateCalendar(title, key, events);
  OUTPUT.push(`
    <a href="${key}.ics" class="flex items-center pb-4 pt-8">
      <div class="text-3xl">
        ${sport.icon} ${sport.name}
      </div>
      <div class="bg-gray-200 hover:bg-blue-200 px-2 py-1 ml-4 rounded-lg text-base">
        Full schedule
      </div>
    </a>
  `);
}

const generateSportTeamCalendar = (sportKey, teamKey) => {
  const sport = SPORTS.find((sport) => sport.key === sportKey);
  const team = TEAMS.find((team) => team.key === teamKey);
  const events = EVENTS.filter((event) => event._SPORT === sport.key && (event._TEAM1 === team.key || event._TEAM2 === team.key));
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
  const events = EVENTS.filter((event) => event._TEAM1 === team.key || event._TEAM2 === team.key);
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
}

const addTeam = (name, key, icon) => {
  if (!TEAMS.find((team) => team.key === key)) {
    TEAMS.push({ name, key, icon });
  }
};

const addSportTeam = (sportKey, teamKey) => {
  const sport = SPORTS.find((sport) => sport.key === sportKey);
  if (sport && !sport.teams.includes(teamKey)) {
    sport.teams.push(teamKey);
  }
}

const isValidTeam = (team) => !team.toLowerCase().startsWith("winner oqt");

const teamSport = async (sportKey) => {
  const data = await downloadSchedule(sportKey);
  const sportName = data.props.pageProps.page.template.properties.title;
  const sportIcon = getSportIcon(sportKey);

  addSport(sportName, sportKey, sportIcon);

  data.props.pageProps.page.items.find((item) => item.name === "scheduleWrapper")
    .data.schedules.forEach((schedule) => {
      schedule.units.forEach(unit => {

        const event = {
          UID: `${sportKey}-${unit.startDateTimeUtc.replace(/[:-]/g, '')}`,
          DTSTAMP: unit.startDateTimeUtc.replace(/[:-]/g, ''),
          DTSTART: unit.startDateTimeUtc.replace(/[:-]/g, ''),
          DTEND: unit.endDateTimeUtc.replace(/[:-]/g, ''),
          DESCRIPTION: `${sportName} - ${unit.description}`,
          SUMMARY: `${sportIcon} ${unit.description}`,
          LOCATION: schedule.venue ? schedule.venue.description : unit.venue.description,
          _SPORT: sportKey,
        }

        if (unit.match &&
          unit.match.team1 && isValidTeam(unit.match.team1.description) &&
          unit.match.team2 && isValidTeam(unit.match.team2.description)
        ) {
          const team1 = {
            name: unit.match.team1.description,
            key: unit.match.team1.teamCode,
            icon: getFlagIcon(unit.match.team1.description),
          };
          addTeam(team1.name, team1.key, team1.icon)

          const team2 = {
            name: unit.match.team2.description,
            key: unit.match.team2.teamCode,
            icon: getFlagIcon(unit.match.team2.description),
          };
          addTeam(team2.name, team2.key, team2.icon)

          event.UID += `-${team1.key}-${team2.key}`;
          event.SUMMARY = `${sportIcon} ${team1.key} ${team1.icon} - ${team2.icon} ${team2.key}`;
          event._TEAM1 = team1.key;
          event._TEAM2 = team2.key;
          addSportTeam(sportKey, team1.key);
          addSportTeam(sportKey, team2.key);
        }

        EVENTS.push(event);

      });
    });
}

const teamSports = async () => {
  await Promise.all(
    [
      '3x3-basketball',
      'basketball',
      'football',
      'handball',
      'hockey',
      'rugby-sevens',
      'volleyball',
      'water-polo',
    ]
      .map((key) => teamSport(key))
  );

  SPORTS.sort((a, b) => a.name > b.name ? 1 : -1).forEach((sport) => {
    const sportKey = sport.key;
    generateSportCalendar(sportKey);
    OUTPUT.push("<ul>")
    sport.teams
      .sort((a, b) => a > b ? 1 : -1)
      .forEach((teamKey) => {
        generateSportTeamCalendar(sportKey, teamKey);
      });
    OUTPUT.push("</ul>")
  });

  OUTPUT.push(`<div class="text-3xl pb-4 pt-8">🌍 Teams</div>`);
  TEAMS
    .sort((a, b) => a.name > b.name ? 1 : -1)
    .forEach((team) => {
      generateTeamCalendar(team.key);
    });
}

const main = async () => {
  await teamSports();

  const template = fs.readFileSync(`${__dirname}/template.html`, 'utf-8');
  const output = template.replace('{{calendars}}', OUTPUT.join('\n'));
  fs.writeFileSync('docs/index.html', output);

  postcss([autoprefixer, tailwindcss])
    .process(fs.readFileSync(`${__dirname}/template.css`, 'utf-8'), { from: 'template.css', to: 'docs/style.css' })
    .then((result) => {
      fs.writeFileSync('docs/style.css', result.css);
    })
};


main();
