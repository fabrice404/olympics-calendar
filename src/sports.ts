const SPORTS: Map<string, string> = new Map([
  ["blind-football", ""],
  ["boccia", ""],
  ["goalball", ""],
  ["para-archery", ""],
  ["para-athletics", ""],
  ["para-badminton", ""],
  ["para-canoe", ""],
  ["para-cycling-road", ""],
  ["para-cycling-track", ""],
  ["para-equestrian", ""],
  ["para-judo", ""],
  ["para-powerlifting", ""],
  ["para-rowing", ""],
  ["para-swimming", ""],
  ["para-table-tennis", ""],
  ["para-taekwondo", ""],
  ["para-triathlon", ""],
  ["shooting-para-sport", ""],
  ["sitting-volleyball", ""],
  ["wheelchair-basketball", ""],
  ["wheelchair-fencing", ""],
  ["wheelchair-rugby", ""],
  ["wheelchair-tennis", ""],
]);

export const getSportIcon = (sport: string): string => {
  if (SPORTS.has(sport)) {
    return SPORTS.get(sport)!;
  }
  console.error(`No icon set for ${sport}`);
  return "";
};

export const getAllSportsKeys = (): string[] => [...SPORTS.keys()];
