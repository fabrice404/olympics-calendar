const cheerio = require('cheerio');
const fs = require('fs');

const URL = 'https://olympics.com/en/paris-2024/schedule/handball';

const downloadSchedule = async () => {
  const response = await fetch(URL);
  const content = await response.text();
  fs.writeFileSync('cache/handball.html', content);
  return content;
};

const getFlag = (country) => {
  switch (country.toLowerCase()) {
    case "angola": return "🇦🇴";
    case "argentina": return "🇦🇷";
    case "brazil": return "🇧🇷";
    case "croatia": return "🇭🇷";
    case "denmark": return "🇩🇰";
    case "france": return "🇫🇷";
    case "egypt": return "🇪🇬";
    case "germany": return "🇩🇪";
    case "hungary": return "🇭🇺";
    case "japan": return "🇯🇵";
    case "korea": return "🇰🇷";
    case "netherlands": return "🇳🇱";
    case "norway": return "🇳🇴";
    case "slovenia": return "🇸🇮";
    case "spain": return "🇪🇸";
    case "sweden": return "🇸🇪";
    default: throw new Error(`No flag set for ${country}`);
  }
}

const countryNameAndFlag = (name, flagFirst = false) => {
  const flag = getFlag(name);
  if (!flag) {
    console.log(name)
  }
  if (flagFirst) return `${flag} ${name}`;
  return `${name} ${flag}`;
}

const main = async () => {
  // const html = await downloadSchedule();
  // const $ = cheerio.load(html);
  // const data = JSON.parse($('#__NEXT_DATA__').text());
  // fs.writeFileSync('cache/handball.json', JSON.stringify(data, null, 2));
  const events = [];
  const data = JSON.parse(fs.readFileSync('cache/handball.json', 'utf-8'));
  data.props.pageProps.page.items.find(item => item.name === "scheduleWrapper").data.schedules.forEach(schedule => {
    const location = schedule.venue.description;
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
        LOCATION: location,
      }
      events.push(event);
    })
  });

  const icalEvents = events.map(event => {
    return `BEGIN:VEVENT\n${Object.entries(event).map(([key, value]) => `${key}:${value}`).join('\n')}\nEND:VEVENT`;
  });

  fs.writeFileSync('docs/handball.ics', `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//fabrice404//olympics-calendar//EN\n${icalEvents.join('\n')}\nEND:VCALENDAR`);
};

main();
