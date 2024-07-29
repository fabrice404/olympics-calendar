export interface Competitor {
  noc: string;
  name: string;
}

export interface Event {
  UID: string;
  DTSTAMP: string;
  DTSTART: string;
  DTEND: string;
  SUMMARY: string;
  DESCRIPTION: string;
  LOCATION: string;

  _COMPETITORS: Competitor[];
  _GENDER: string;
  _MEDAL: boolean;
  _NOCS: string[];
  _SPORT: string;
  _UNITNAME: string;
}

export interface Sport {
  key: string;
  name: string;
  NOCS: string[];
}

export interface NOC {
  icon: string;
  name: string;
}
