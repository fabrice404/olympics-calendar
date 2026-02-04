export interface MultilingualString {
  [key: string]: string;
}

export interface Language {
  code: string;
  name: string;
  code3: string;
}

export interface Sport {
  key: string;
  name: MultilingualString;
  order: number;
}

export interface NOC {
  key: string;
  name: MultilingualString;
}

export interface Competitor {
  noc: string;
  code: string;
  name: string;
}

export interface Event {
  key: string;
  start: string;
  end: string;
  sport: string;
  medal: "0" | "1" | "3";
  name: MultilingualString;
  location: MultilingualString;
  nocs: string[];
  competitors: string[];
}

export interface Calendar {
  languages: Language[];
  sports: Sport[];
  nocs: NOC[];
  competitors: Competitor[];
  events: Event[];
}
