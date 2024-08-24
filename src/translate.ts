const allSports = new Map<string, string>([
  ["en", "All sports"],
  ["ja", "すべてのスポーツ"],
  ["ko", "모든 스포츠"],
  ["ru", "Все виды спорта"],
  ["zh", "所有运动"],
]);

const calendars = new Map<string, string>([
  ["en", "Calendars"],
  ["ja", "カレンダー"],
  ["ko", "달력"],
  ["ru", "Календари"],
  ["zh", "日历"],
]);

const closingCeremony = new Map<string, string>([
  ["en", "Closing Ceremony"],
  ["ja", "閉会式"],
  ["ko", "폐막식"],
  ["ru", "Церемония закрытия"],
  ["zh", "闭幕式"],
]);

const disclaimer = new Map<string, string>([
  ["en", "This webiste is not affiliated with the International Olympic Committee. All trademarks, logos and brand names are the property of their respective owners."],
  ["ja", "このウェブサイトは国際オリンピック委員会とは関係ありません。すべての商標、ロゴ、およびブランド名はそれぞれの所有者の財産です。"],
  ["ko", "이 웹 사이트는 국제 올림픽 위원회와 관련이 없습니다. 모든 상표, 로고 및 상표는 각 소유자의 소유입니다."],
  ["ru", "Этот сайт не связан с Международным олимпийским комитетом. Все товарные знаки, логотипы и бренды являются собственностью их соответствующих владельцев."],
  ["zh", "本网站与国际奥林匹克委员会无关。所有商标、标志和品牌名称均为其各自所有者的财产。"],
]);

const fullSchedule = new Map<string, string>([
  ["en", "Full schedule"],
  ["ja", "フルスケジュール"],
  ["ko", "전체 일정"],
  ["ru", "Полное расписание"],
  ["zh", "完整时间表"],
]);

const genderMen = new Map<string, string>([
  ["en", "M"],
  ["ja", "男性"],
  ["ko", "남성"],
  ["ru", "М"],
  ["zh", "男"],
]);

const genderWomen = new Map<string, string>([
  ["en", "W"],
  ["ja", "女性"],
  ["ko", "여성"],
  ["ru", "Ж"],
  ["zh", "女"],
]);

const medalEvents = new Map<string, string>([
  ["en", "Medal events"],
  ["ja", "メダルイベント"],
  ["ko", "메달 이벤트"],
  ["ru", "Медальные события"],
  ["zh", "奖牌赛事"],
]);

const medalsTable = new Map<string, string>([
  ["en", "Medals table"],
  ["ja", "メダル表"],
  ["ko", "메달 테이블"],
  ["ru", "Таблица медалей"],
  ["zh", "奖牌榜"],
]);

const noEventToday = new Map<string, string>([
  ["en", "No event today, come back tomorrow! :)"],
  ["ja", "今日のイベントはありません。明日また来てください！ :)"],
  ["ko", "오늘 이벤트가 없습니다. 내일 다시 오세요! :)"],
  ["ru", "Сегодня нет событий, вернитесь завтра! :)"],
  ["zh", "今天没有活动，请明天再来！ :)"],
]);

const openingCeremony = new Map<string, string>([
  ["en", "Opening Ceremony"],
  ["ja", "開会式"],
  ["ko", "개막식"],
  ["ru", "Церемония открытия"],
  ["zh", "开幕式"],
]);

const todaysEvents = new Map<string, string>([
  ["en", "Today's events"],
  ["ja", "今日のイベント"],
  ["ko", "오늘의 이벤트"],
  ["ru", "События сегодня"],
  ["zh", "今天的活动"],
]);

const medalsTableError = new Map<string, string>([
  ["en", "Due to a recent update on the official website, the information on this page may no longer be accurate."],
  ["ja", "公式ウェブサイトの最新情報により、このページの情報が正確でない可能性があります。"],
  ["ko", "공식 웹 사이트의 최신 정보로 인해이 페이지의 정보가 더 이상 정확하지 않을 수 있습니다."],
  ["ru", "Из-за недавнего обновления на официальном сайте информация на этой странице может быть недействительной."],
  ["zh", "由于官方网站的最新更新，此页面上的信息可能不再准确。"],
]);

export const translate = (text: string, language: string) => text
  .replace(/\{\{translate_allSports}}/gi, allSports.get(language)!)
  .replace(/\{\{translate_calendars}}/gi, calendars.get(language)!)
  .replace(/\{\{translate_closingCeremony}}/gi, closingCeremony.get(language)!)
  .replace(/\{\{translate_disclaimer}}/gi, disclaimer.get(language)!)
  .replace(/\{\{translate_fullSchedule}}/gi, fullSchedule.get(language)!)
  .replace(/\{\{translate_genderMen}}/gi, genderMen.get(language)!)
  .replace(/\{\{translate_genderWomen}}/gi, genderWomen.get(language)!)
  .replace(/\{\{translate_medalEvents}}/gi, medalEvents.get(language)!)
  .replace(/\{\{translate_medalsTable}}/gi, medalsTable.get(language)!)
  .replace(/\{\{translate_medalsTableError}}/gi, medalsTableError.get(language)!)
  .replace(/\{\{translate_noEventToday}}/gi, noEventToday.get(language)!)
  .replace(/\{\{translate_openingCeremony}}/gi, openingCeremony.get(language)!)
  .replace(/\{\{translate_todaysEvents}}/gi, todaysEvents.get(language)!)
  .replace(/\{\{refresh}}/gi, "20240824T2035")
  ;
