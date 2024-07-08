const cheerio = require('cheerio');
const fs = require('fs');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');

const downloadSchedule = async (sport) => {
  const cacheFile = `${__dirname}/cache/${sport}.html`;

  if (!fs.existsSync(cacheFile)) {
    const response = await fetch(`https://olympics.com/en/paris-2024/schedule/${sport}`);
    const content = await response.text();
    fs.writeFileSync(cacheFile, content);
  }

  const html = fs.readFileSync(cacheFile, 'utf-8');
  const $ = cheerio.load(html);
  return JSON.parse($('#__NEXT_DATA__').text());
};

const getSportIcon = (sport) => {
  switch (sport.toLowerCase()) {
    case "3x3-basketball": return "🏀3"
    case "basketball": return "🏀";
    case "football": return "⚽";
    case "handball": return "🤾";
    case "hockey": return "🏑";
    case "volleyball": return "🏐";
    default: throw new Error(`No icon set for ${sport}`);
  }
};

const getFlag = (country) => {
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
    case "france": return "🇫🇷";
    case "egypt": return "🇪🇬";
    case "germany": return "🇩🇪";
    case "great britain": return "🇬🇧";
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
    case "morocco": return "🇲🇦";
    case "nigeria": return "🇳🇬";
    case "netherlands": return "🇳🇱";
    case "new zealand": return "🇳🇿";
    case "norway": return "🇳🇴";
    case "paraguay": return "🇵🇾";
    case "poland": return "🇵🇱";
    case "puerto rico": return "🇵🇷";
    case "serbia": return "🇷🇸";
    case "south africa": return "🇿🇦";
    case "south sudan": return "🇸🇸";
    case "slovenia": return "🇸🇮";
    case "spain": return "🇪🇸";
    case "sweden": return "🇸🇪";
    case "türkiye": return "🇹🇷";
    case "ukraine": return "🇺🇦";
    case "united states": return "🇺🇸";
    case "uzbekistan": return "🇺🇿";
    case "zambia": return "🇿🇲";
    default: throw new Error(`No flag set for ${country}`);
  }
}

const countryNameAndFlag = (name, flagFirst = false) => {
  const flag = getFlag(name);
  if (flagFirst) return `${flag} ${name}`;
  return `${name} ${flag}`;
}

const teams = [];
const addTeamEvent = (team, event) => {
  if (teams[team] == null) {
    teams[team] = [];
  }
  teams[team].push(event);
}

const getTeamSport = async (sport) => {
  const data = await downloadSchedule(sport);
  const events = [];
  const sportName = data.props.pageProps.page.template.properties.title;

  data.props.pageProps.page.items.find(item => item.name === "scheduleWrapper").data.schedules.forEach(schedule => {
    schedule.units.forEach(unit => {
      let title = `${getSportIcon(sport)} ${unit.description}`;
      let uid = `sport-${unit.startDateTimeUtc.replace(/[:-]/g, '')}`;

      if (unit.match && unit.match.team1) {
        title = `${getSportIcon(sport)} ${countryNameAndFlag(unit.match.team1.description)} - ${countryNameAndFlag(unit.match.team2.description, true)}`;
        uid += `-${unit.match.team1.description.replace(/ /g, '-')}-${unit.match.team2.description.replace(/ /g, '-')}`;
      }

      const event = {
        UID: uid,
        DTSTAMP: unit.startDateTimeUtc.replace(/[:-]/g, ''),
        DTSTART: unit.startDateTimeUtc.replace(/[:-]/g, ''),
        DTEND: unit.endDateTimeUtc.replace(/[:-]/g, ''),
        DESCRIPTION: unit.description,
        SUMMARY: title,
        LOCATION: schedule.venue ? schedule.venue.description : unit.venue.description,
      }
      events.push(event);
      if (unit.match && unit.match.team1) {
        addTeamEvent(unit.match.team1.description, event);
      }

      if (unit.match && unit.match.team2) {
        addTeamEvent(unit.match.team2.description, event);
      }
    })
  });

  const icalEvents = events.map(event => {
    return `BEGIN:VEVENT\r\n${Object.entries(event).map(([key, value]) => `${key}:${value}`).join('\r\n')}\r\nEND:VEVENT`;
  });

  const name =
    fs.writeFileSync(`docs/sport/${sport}.ics`, `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//fabrice404//olympics-calendar//EN\r\nX-WR-CALNAME:${sportName} | Paris 2024\r\nNAME:${sportName} | Paris 2024\r\n${icalEvents.join('\r\n')}\r\nEND:VCALENDAR`);
};

const main = async () => {
  const sports = [
    '3x3-basketball',
    'basketball',
    'football',
    'handball',
    'hockey',
    'volleyball'
  ]
  await Promise.all(sports.map(sport => getTeamSport(sport)));

  Object.entries(teams).filter(([team, events]) => !team.startsWith("Winner")).forEach(([team, events]) => {
    const icalEvents = events.map(event => {
      return `BEGIN:VEVENT\r\n${Object.entries(event).map(([key, value]) => `${key}:${value}`).join('\r\n')}\r\nEND:VEVENT`;
    });
    const teamKey = team.toLowerCase().replace(/ /g, '-');
    fs.writeFileSync(`docs/team/${teamKey}.ics`, `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//fabrice404//olympics-calendar//EN\r\nX-WR-CALNAME:${team} | Paris 2024\r\nNAME:${team} | Paris 2024\r\n${icalEvents.join('\r\n')}\r\nEND:VCALENDAR`);
  });


  const template = fs.readFileSync(`${__dirname}/template.html`, 'utf-8');
  const output = template
    .replace('{{sports}}', sports.map(sport => `<li><a href="sport/${sport}.ics" class="text-blue-500">${getSportIcon(sport)} ${sport}</a></li>`).join('\n'))
    .replace('{{teams}}', Object.keys(teams).sort().filter(team => !team.startsWith("Winner")).map(team => `<li><a href="team/${team.toLowerCase().replace(/ /g, '-')}.ics" class="text-blue-500">${countryNameAndFlag(team, true)}</a></li>`).join('\n'))

  fs.writeFileSync('docs/index.html', output);

  const result = postcss([autoprefixer, tailwindcss])
    .process(fs.readFileSync(`${__dirname}/template.css`, 'utf-8'), { from: 'template.css', to: 'docs/style.css' })
    .then((result) => {
      fs.writeFileSync('docs/style.css', result.css);
    })

};

main();
