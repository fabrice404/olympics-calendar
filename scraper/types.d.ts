export interface MultilingualString {
  [key: string]: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface Sport {
  key: string;
  name: MultilingualString;
  order: number;
}

export interface Team {
  key: string;
  name: MultilingualString;
}

export interface Match {
  team1: Team;
  team2: Team;
}

export interface Event {
  key: string;
  start: string;
  end: string;
  sport: string;
  isTraining: boolean;
  medal: "0" | "1" | "3";
  name: MultilingualString;
  location: MultilingualString;
  match?: Match;
}

export interface Calendar {
  languages: Language[];
  sports: Sport[];
  events: Event[];
  nocs: Team[];
}

export interface PageData {
  props: {
    pageProps: {
      page: {
        template: {
          properties: {
            header: {
              mainNav: {
                languages: {
                  link: string;
                  lang: string;
                  label: string;
                }[];
              };
            };
          };
        };
        items: {
          type: string;
          name: string;
          data: {
            disciplines: {
              disciplineCode: string;
              order: number;
              description: string;
            }[];
            schedules: {
              units: {
                unitCode: string;
                startDateTimeUtc: string;
                endDateTimeUtc: string;
                isTraining: boolean;
                medal: "0" | "1" | "3";
                description: string;
                venue: {
                  description: string;
                };
                match?: {
                  team1: {
                    teamCode: string;
                    description: string;
                  };
                  team2: {
                    teamCode: string;
                    description: string;
                  };
                };
              }[];
            }[];
          };
        }[];
      };
    };
  };
}
