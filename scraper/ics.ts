// BEGIN:VCALENDAR
// VERSION:2.0
// PRODID:-//fabrice404//olympics-calendar//archery/AUS//EN
// X-WR-CALNAME:🇦🇺 Australia Archery | Paris 2024
// NAME:🇦🇺 Australia Archery | Paris 2024
// BEGIN:VEVENT
// UID:20240725T073000Z-archery-WOMENS-INDIVIDUAL-RANKING-ROUND
// DTSTAMP:20240725T073000Z
// DTSTART:20240725T073000Z
// DTEND:20240725T103000Z
// DESCRIPTION:Archery - Women's Individual Ranking Round\n🇨🇳 AN
//   Qixuan\n🇲🇽 Alejandra VALENCIA\n🇲🇩 Alexandra MIRCA\n🇵🇷 Alondra
//   RIVERA\n🇫🇷 Amelie CORDEAU\n🇧🇷 Ana Luiza SLIACHTICAS CAETANO\n🇨🇴 Ana
//   RENDON MARTINEZ\n🇲🇽 Ana VAZQUEZ\n🇲🇽 Angela RUIZ\n🇮🇳 Ankita
//   BHAKAT\n🇲🇾 Ariana Nur Dania MOHAMAD ZAIRI\n🇮🇳 Bhajan KAUR\n🇬🇧
//   Bryony PITMAN\n🇹🇼 CHIU Yi-Ching\n🇫🇷 Caroline LOPEZ\n🇺🇸 Casey
//   KAUFHOLD\n🇺🇸 Catalina GNORIEGA\n🇩🇪 Charline SCHWARZ\n🇮🇹 Chiara
//   REBAGLIATI\n🇮🇳 Deepika KUMARI\n🇸🇰 Denisa BARANKOVA\n🇮🇩 Diananda
//   CHOIRUNISA\n🇪🇸 Elia CANALES\n🇹🇷 Elif Berra GOKKIR\n🇦🇹 Elisabeth
//   STRAKA\n🇬🇳 Fatoumata SYLLA\n🇳🇱 Gaby SCHLOESSER\n🇸🇲 Giorgia
//   CESARINI\n🇰🇷 JEON Hunyoung\n🇪🇬 Jana ALI\n🇺🇸 Jennifer MUCINO\n🇩🇪
//   Katharina BAUER\n🇩🇰 Kirstine DANSTRUP ANDERSEN\n🇹🇼 LEI
//   Chien-Ying\n🇨🇳 LI Jiaman\n🇹🇼 LI Tsai-Chi\n🇰🇷 LIM Sihyeon\n🇦🇺
//   Laura PAEGLIS\n🇳🇱 Laura van der WINKEL\n🇫🇷 Lisa BARBELIN\n🇷🇴
//   Madalina AMAISTROAIE\n🇨🇿 Marie HORACKOVA\n🇬🇧 Megs HAVERS\n🇩🇪
//   Michelle KROPPEN\n🇮🇱 Mikaella MOSHE\n🇮🇷 Mobina FALLAH\n🇰🇷 NAM
//   Suhyeon\n🇯🇵 NODA Satsuki\n🇲🇾 Nurul Azreena MOHAMAD FAZIL\n🇬🇧 Penny
//   HEALEY\n🇳🇱 Quinty ROEFFEN\n🇪🇪 Reena PARNAT\n🇮🇩 Rezza OCTAVIA\n🇹🇳
//   Rihab ELWALID\n🇲🇾 Syaqiera MASHAYIKH\n🇮🇩 Syifa Nurafifah KAMAL\n🇻🇳
//   Thi Anh Nguyet DO\n🇺🇦 Veronika MARCHENKO\n🇨🇦 Virginie CHENIER\n🇵🇱
//   Wioleta MYSZOR\n🇨🇳 YANG Xiaolei\n🇦🇿 Yaylagul RAMAZANOVA\n🇸🇮 Zana
//   PINTARIC\n🇺🇿 Ziyodakhon ABDUSATTOROVA
// SUMMARY:🏹 Women's Individual Ranking Round
// LOCATION:Invalides
// END:VEVENT

import { mkdirSync, writeFileSync } from "fs";
import { Calendar } from "./types";
import { getFlag } from "./nocs";


// BEGIN:VCALENDAR
// VERSION:2.0
// PRODID:-//fabrice404//olympics-calendar//3x3-basketball/AUS//EN
// X-WR-CALNAME:🇦🇺 Australia 3x3 Basketball | Paris 2024
// NAME:🇦🇺 Australia 3x3 Basketball | Paris 2024
// BEGIN:VEVENT
// UID:20240730T160000Z-3x3-basketball-WOMENS-POOL-ROUND-AUS-CAN
// DTSTAMP:20240730T160000Z
// DTSTART:20240730T160000Z
// DTEND:20240730T162500Z
// DESCRIPTION:3x3 Basketball - Women's Pool Round
// SUMMARY:🏀 AUS 🇦🇺 - 🇨🇦 CAN
// LOCATION:La Concorde 1
// END:VEVENT

// END:VCALENDAR

export const generateICSFiles = (calendar: Calendar): void => {

  generateICSFile(calendar, null, null);

  calendar.sports.forEach((sport) => {
    generateICSFile(calendar, sport.key, null);
    calendar.nocs.forEach((noc) => {
      generateICSFile(calendar, sport.key, noc.key);
    });
  });

  calendar.nocs.forEach((noc) => {
    generateICSFile(calendar, null, noc.key);
  });
};


export const generateICSFile = (calendar: Calendar, sportKey: string | null, nocKey: string | null): void => {
  calendar.languages.forEach((lang) => {
    const pathSportKey = sportKey ? sportKey : "all-sports";
    const pathNocKey = nocKey ? nocKey : "calendar"

    const filepath = `../ui/public/data/${lang.code.toLowerCase()}/${pathSportKey.toLowerCase()}/${pathNocKey.toLowerCase()}.ics`;
    mkdirSync(filepath.split('/').slice(0, -1).join('/'), { recursive: true });

    const titleComponents = [];
    if (nocKey) {
      titleComponents.push(`${calendar.nocs.find(n => n.key === nocKey)!.name[lang.code]}`);
    }
    if (sportKey) {
      titleComponents.push(calendar.sports.find(s => s.key === sportKey)!.name[lang.code]);
    }
    titleComponents.push("Milano Cortina 2026");

    const title = titleComponents.join(' - ');

    const lines = [];

    lines.push("BEGIN:VCALENDAR");
    lines.push("VERSION:2.0");
    lines.push(`PRODID:-//fabrice404//olympics-calendar//${lang.code}/${pathSportKey}/${pathNocKey}`);
    lines.push(`X-WR-CALNAME:${title}`);
    lines.push(`NAME:${title}`);

    calendar.events
      .filter((event) => {
        if (sportKey && event.sport !== sportKey) return false;
        if (nocKey) {
          if (event.match) {
            const team1Key = event.match.team1.key;
            const team2Key = event.match.team2.key;
            if (team1Key !== nocKey && team2Key !== nocKey) {
              return false;
            }
          } else {
            return false;
          }
        }
        return true;
      })
      .forEach((event) => {
        lines.push("BEGIN:VEVENT");
        lines.push(`UID:${event.key.replace(/--/g, '-')}`);
        lines.push(`DTSTAMP:${event.start.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`);
        lines.push(`DTSTART:${event.start.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`);
        lines.push(`DTEND:${event.end.replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`);
        lines.push(`LOCATION:${event.location[lang.code] || ''}`);

        const sport = calendar.sports.find(s => s.key === event.sport)!;
        lines.push(`DESCRIPTION:${sport.name[lang.code]} - ${event.name[lang.code] || ''}`);
        let summary = `SUMMARY:${event.name[lang.code] || ''}`

        if (event.match) {
          const team1Name = event.match.team1.name[lang.code] || event.match.team1.key;
          const team1Flag = getFlag(event.match.team1.key);
          const team2Name = event.match.team2.name[lang.code] || event.match.team2.key;
          const team2Flag = getFlag(event.match.team2.key);
          if (team1Name && team2Name) {
            lines.push(`SUMMARY:${team1Flag} ${team1Name} - ${team2Name} ${team2Flag}`);
          }
        }

        lines.push(summary);
        lines.push(`END:VEVENT`);

      })

    lines.push("END:VCALENDAR");

    writeFileSync(filepath, lines.join('\n'));
  });
};
