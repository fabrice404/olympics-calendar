const SPORTS: Map<string, string> = new Map([
  ["3x3-basketball", "🏀"],
  ["archery", "🏹"],
  ["artistic-gymnastics", "🤸"],
  ["artistic-swimming", "🏊"],
  ["athletics", "🏃"],
  ["badminton", "🏸"],
  ["basketball", "🏀"],
  ["beach-volleyball", "🏐"],
  ["boxing", "🥊"],
  ["breaking", "🤸"],
  ["canoe-slalom", "🛶"],
  ["canoe-sprint", "🛶"],
  ["cycling-bmx-freestyle", "🚴"],
  ["cycling-bmx-racing", "🚴"],
  ["cycling-mountain-bike", "🚴"],
  ["cycling-road", "🚴"],
  ["cycling-track", "🚴"],
  ["diving", "🏊"],
  ["equestrian", "🏇"],
  ["fencing", "🤺"],
  ["football", "⚽"],
  ["golf", "⛳"],
  ["handball", "🤾"],
  ["hockey", "🏑"],
  ["judo", "🥋"],
  ["marathon-swimming", "🏊"],
  ["modern-pentathlon", "🤺"],
  ["rhythmic-gymnastics", "🤸"],
  ["rowing", "🚣"],
  ["rugby-sevens", "🏉"],
  ["sailing", "⛵"],
  ["shooting", "🔫"],
  ["skateboarding", "🛹"],
  ["sport-climbing", "🧗"],
  ["surfing", "🏄"],
  ["swimming", "🏊"],
  ["table-tennis", "🏓"],
  ["taekwondo", "🥋"],
  ["tennis", "🎾"],
  ["trampoline-gymnastics", "🤸"],
  ["triathlon", "🏊"],
  ["volleyball", "🏐"],
  ["water-polo", "🤽"],
  ["weightlifting", "🏋"],
  ["wrestling", "🤼"],
]);

export const getSportIcon = (sport: string): string => {
  if (SPORTS.has(sport)) {
    return SPORTS.get(sport)!;
  }
  console.error(`No icon set for ${sport}`);
  return "";
};

export const getAllSportsKeys = (): string[] => [...SPORTS.keys()];
