const cheerio = require('cheerio');
const fs = require('fs');

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

const getFlag = (country) => {
  switch (country.toLowerCase()) {
    case "angola": return "🇦🇴";
    case "argentina": return "🇦🇷";
    case "australia": return "🇦🇺";
    case "brazil": return "🇧🇷";
    case "canada": return "🇨🇦";
    case "colombia": return "🇨🇴";
    case "croatia": return "🇭🇷";
    case "denmark": return "🇩🇰";
    case "dominican republic": return "🇩🇴";
    case "france": return "🇫🇷";
    case "egypt": return "🇪🇬";
    case "germany": return "🇩🇪";
    case "guinea": return "🇬🇳";
    case "hungary": return "🇭🇺";
    case "iraq": return "🇮🇶";
    case "israel": return "🇮🇱";
    case "japan": return "🇯🇵";
    case "korea": return "🇰🇷";
    case "mali": return "🇲🇱";
    case "morocco": return "🇲🇦";
    case "nigeria": return "🇳🇬";
    case "netherlands": return "🇳🇱";
    case "new zealand": return "🇳🇿";
    case "norway": return "🇳🇴";
    case "paraguay": return "🇵🇾";
    case "slovenia": return "🇸🇮";
    case "spain": return "🇪🇸";
    case "sweden": return "🇸🇪";
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

const getTeamSport = async (sport) => {
  const data = await downloadSchedule(sport);
  const events = [];

  data.props.pageProps.page.items.find(item => item.name === "scheduleWrapper").data.schedules.forEach(schedule => {
    schedule.units.forEach(unit => {
      let title = unit.description;

      if (unit.match && unit.match.team1) {
        title = `${countryNameAndFlag(unit.match.team1.description)} - ${countryNameAndFlag(unit.match.team2.description, true)}`;
      }

      const event = {
        UID: unit.unitCode,
        DTSTAMP: unit.startDateTimeUtc.replace(/[:-]/g, ''),
        DTSTART: unit.startDateTimeUtc.replace(/[:-]/g, ''),
        DTEND: unit.endDateTimeUtc.replace(/[:-]/g, ''),
        DESCRIPTION: unit.description,
        SUMMARY: title,
        LOCATION: schedule.venue ? schedule.venue.description : unit.venue.description,
      }
      events.push(event);
    })
  });

  const icalEvents = events.map(event => {
    return `BEGIN:VEVENT\r\n${Object.entries(event).map(([key, value]) => `${key}:${value}`).join('\r\n')}\r\nEND:VEVENT`;
  });

  fs.writeFileSync(`docs/${sport}.ics`, `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//fabrice404//olympics-calendar//EN\r\n${icalEvents.join('\r\n')}\r\nEND:VCALENDAR`);
};

const main = async () => {
  // getTeamSport('handball');
  getTeamSport('football');
};

main();
