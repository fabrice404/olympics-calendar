/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { loadSchedule } from "../../lib/data";
import { use, useEffect, useState } from "react";
import Flag from "../flag";
import { ALL_EVENTS, COPY, COPY_SUCCESS, FILTER_BY_COUNTRY, FILTER_BY_EVENT_TYPE, FILTER_BY_SPORT, GOLD_MEDAL_EVENTS, LANGUAGE, MADE_BY_FABRICE, MEDAL_EVENTS, NOT_AFFILIATED, NO_EVENT_FOR_FILTERS } from "../../lib/text";
import useLocalStorage from "@/lib/local-storage";
import { GoogleAnalytics } from "@next/third-parties/google";

import { Google_Sans, SUSE_Mono } from "next/font/google";
import { permanentRedirect, usePathname } from "next/navigation";

const googleSans = Google_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  fallback: ["sans-serif"],
});

const suseMono = SUSE_Mono({
  variable: "--font-suse-mono",
  subsets: ["latin"],
  fallback: ["sans-serif"],
});

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

const COLORS = ['azzurro', 'giallo', 'rosa', 'rosso', 'verde', 'viola'];


const EVENT_TYPE_ALL = "all";
const EVENT_TYPE_MEDAL = "medal-events";
const EVENT_TYPE_GOLD_MEDAL = "gold-medal-events";

const EVENT_TYPES = [{
  key: EVENT_TYPE_ALL.toUpperCase(),
  name: ALL_EVENTS
}, {
  key: EVENT_TYPE_MEDAL.toUpperCase(),
  name: MEDAL_EVENTS,
}, {
  key: EVENT_TYPE_GOLD_MEDAL.toUpperCase(),
  name: GOLD_MEDAL_EVENTS,
}]

const DEFAULT_NOC = "world";
const DEFAULT_SPORT = "all-sports";
const DEFAULT_EVENT_TYPE = EVENT_TYPE_ALL;

export default function Home({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const qs = typeof window !== 'undefined' ? window.location.search ? new URLSearchParams(window.location.search) : new URLSearchParams() : new URLSearchParams();
  const { slug } = use(params);
  const pathname = usePathname();

  const [data, setData] = useState<Calendar | null>(null);
  const [language, setLanguage] = useLocalStorage('lang', (navigator.language || 'en').split('-')[0]);
  const [cookieConsent, setCookieConsent] = useLocalStorage('cookie-consent', 'null');

  const translate = (text: MultilingualString) => {
    return text[`${language}`] || text['en'] || Object.values(text)[0] || '';
  };

  const getParams = () => ({
    noc: slug?.length ? slug[0].toLowerCase() : DEFAULT_NOC,
    sport: slug?.length >= 2 ? slug[1].toLowerCase() : DEFAULT_SPORT,
    type: slug?.length >= 3 ? slug[2].toLowerCase() : DEFAULT_EVENT_TYPE,
  })

  const generateLink = ({ noc, sport, type }: { noc?: string; sport?: string; type?: string }) => {
    const { noc: newNOC, sport: newSport, type: newType } = getParams();

    if (type && type !== DEFAULT_EVENT_TYPE) {
      return `/${noc || newNOC}/${sport || newSport}/${type}`.toLowerCase();
    }

    return `/${noc || newNOC}/${sport || newSport}`.toLowerCase();
  }

  const generateCalendarLink = () => {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const { noc, sport, type } = getParams();

    if(type !== DEFAULT_EVENT_TYPE) {
      return `http://${host}/api/data/${language}/${sport}/${type}.ics`;
    }

    return `http://${host}/api/data/${language}/${sport}/${noc === DEFAULT_NOC ? "calendar" : noc}.ics`;
  };

  const getColor = (i: number) => COLORS[i % COLORS.length];

  useEffect(() => {
    let selectedNOC = DEFAULT_NOC;
    let selectedSport = DEFAULT_SPORT;

    if (qs.get('noc')) {
      selectedNOC = qs.get('noc')!.toLowerCase();
    } else if (slug?.length >= 1) {
      selectedNOC = getParams().noc.toLowerCase();
    }

    if (qs.get('sport')) {
      selectedSport = qs.get('sport')!.toLowerCase();
    } else if (slug?.length >= 2) {
      selectedSport = getParams().sport.toLowerCase();
    }

    let expectedUrl = `/${selectedNOC}/${selectedSport}`;
    if (getParams().type !== DEFAULT_EVENT_TYPE) {
      expectedUrl = `/${selectedNOC}/${selectedSport}/${getParams().type}`;
    }
    if (pathname !== expectedUrl) {
      permanentRedirect(expectedUrl);
    }

    if (data == null) {
      loadSchedule()
        .then(setData)
        .catch(console.log);
    }
  }, [data]);

  const filter = (event: Event) => {
    let visible = true;

    if (event.end < new Date().toISOString()) {
      return false;
    }

    const { noc, sport, type } = getParams();

    if (
      noc !== DEFAULT_NOC &&
      !event.nocs.includes(noc.toUpperCase())
    ) {
      visible = false;
    }

    if (
      sport !== DEFAULT_SPORT &&
      event.sport !== sport.toUpperCase()
    ) {
      visible = false;
    }

    if (type !== DEFAULT_EVENT_TYPE) {
      if (
        (type === "medal-events" && event.medal === "0") ||
        (type === "gold-medal-events" && event.medal !== "1")
      ) {
        visible = false;
      }
    }

    return visible;
  }

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const button = document.getElementById('copy_button')!;
      navigator.clipboard.writeText(text).then(() => {
        button.textContent = translate(COPY_SUCCESS);
        button.classList.add('text-success');
        button.classList.add('font-bold');
        setTimeout(() => {
          button.textContent = translate(COPY);
          button.classList.remove('text-success');
          button.classList.remove('font-bold');
        }, 2000);
      });
    }
  }

  const calendarLink = generateCalendarLink();

  if (data) {
    let lastDay = "";
    if (data.languages.find(lang => lang.code === language) === undefined) {
      setLanguage('en')
    }

    const events = data.events.filter(event => filter(event));

    let main = (
      <div>
        <div className="text-center pt-10 mb-100">
          {translate(NO_EVENT_FOR_FILTERS)}
        </div>
      </div>
    )

    if (events.length) {
      main = (
        <div>
          <div className="text-center pt-6">
            <span className="input md:w-1/3">
              <input type="text" placeholder={calendarLink} readOnly={true} />
              <button id="copy_button" className="label cursor-pointer" onClick={() => copyToClipboard(calendarLink)}>{translate(COPY)}</button>
            </span>

            <div className="pt-2 md:pt-0 lg:inline-block">
              <a className="inline-block" href={calendarLink.replace("https://", "webcal://")} target="_blank">
                <img src="/img/icon-apple.svg" alt="Apple Calendar" className="inline-block size-6 ml-4 mr-2" />
              </a>

              <a className="inline-block" href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(calendarLink)}`} target="_blank">
                <img src="/img/icon-google.svg" alt="Google Calendar" className="inline-block size-5 ml-4 mr-2" />
              </a>

              <a className="inline-block" href={`https://outlook.office.com/calendar/0/deeplink/subscribe?url=${encodeURIComponent(calendarLink)}`} target="_blank">
                <img src="/img/icon-office365.svg" alt="Office 365 Calendar" className="inline-block size-5 ml-4 mr-2" />
              </a>

              <a className="inline-block" href={`https://outlook.live.com/calendar/0/deeplink/subscribe?url=${encodeURIComponent(calendarLink)}`} target="_blank">
                <img src="/img/icon-outlookcom.svg" alt="Outlook Calendar" className="inline-block size-5 ml-4 mr-2" />
              </a>

              <a className="inline-block" href={`https://calendar.yahoo.com/?ics=${encodeURIComponent(calendarLink)}`} target="_blank">
                <img src="/img/icon-yahoo.svg" alt="Yahoo Calendar" className="inline-block size-5 ml-4 mr-2" />
              </a>

            </div>
          </div>
          {
            events
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((event, i) => {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                const startHours = startDate.getHours().toString().padStart(2, '0');
                const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
                const endHours = endDate.getHours().toString().padStart(2, '0');
                const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

                let titleColor = "fg-main";
                if (event.medal === '1') {
                  titleColor = "bg-gold";
                } else if (event.medal === '3') {
                  titleColor = "bg-bronze";
                }

                const day = event.start.split('T')[0];
                let dayHeader = <></>;

                if (lastDay !== day) {
                  dayHeader = (
                    <div className="day-header text-center my-8">
                      <h2 className="text-3xl font-light fg-main">
                        {new Date(event.start).toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h2>
                    </div>
                  );
                }
                // eslint-disable-next-line react-hooks/immutability
                lastDay = day;


                const getCompetitor = (competitorId: string) => {
                  if (competitorId.startsWith("team:")) {
                    const team = data.nocs.find(noc => noc.key === competitorId.replace("team:", ""));
                    return { noc: team!.key, name: translate(team!.name) };
                  }
                  const competitor = data.competitors.find(comp => comp.code === competitorId);
                  return { noc: competitor!.noc, name: competitor!.name };
                };

                let competitors = <></>;
                if (event.competitors.length > 0) {
                  competitors = (
                    <ul>
                      {
                        event.competitors
                          .map((competitorId) => {
                            const competitor = getCompetitor(competitorId);
                            if (!competitor) return null;
                            const noc = data.nocs.find(noc => noc.key === competitor.noc);
                            if (event.competitors.length === 2 || getParams().noc.toUpperCase() === competitor.noc) {
                              return (
                                <li key={competitorId}>
                                  <Flag iso3={competitor.noc} name={translate(noc!.name)} /> {competitor.name}
                                </li>
                              );
                            }
                          })
                      }
                    </ul>
                  );
                }

                let nocs = <></>;
                if (event.nocs.length > 0 && event.competitors.length !== 2) {
                  nocs = (
                    <div>
                      {
                        event.nocs.toSorted((a, b) => a.localeCompare(b)).map((nocKey) => {
                          const noc = data.nocs.find(noc => noc.key === nocKey);
                          if (!noc) return null;
                          return (
                            <Flag key={nocKey} iso3={noc.key} name={translate(noc.name)} size="sm" />
                          );
                        })
                      }
                    </div>
                  );
                }


                return (
                  <div key={event.key}>
                    {dayHeader}
                    <div className="flex p-2 m-2 my-4 bg-white rounded-md md:w-3/4 md:mx-auto">
                      <div className={`flex-none fg-${getColor(i)} ${suseMono.className} text-right font-bold align-top inline-block tabular-nums pr-2`}>
                        <span className="text-xl">{startHours}:{startMinutes}</span>
                        <div className="text-xs">{endHours}:{endMinutes}</div>
                      </div>
                      <div className="shrink align-top inline-block text-black pl-2 border-l border-slate-900/10">
                        <div className="font-bold">
                          {translate(data.sports.find(sport => sport.key === event.sport)?.name || {})}
                        </div>
                        <div className={`inline-block font-bold text-sm ${titleColor}`}>{translate(event.name)}</div>
                        {competitors}
                        {nocs}
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      )
    }

    const header = (
      <div className="navbar bg-main">
        <div className={`flex-1 ${googleSans.className}`}>
          <a href="/world/all-sports" className="text-xl font-bold">Olympics Calendar</a>
        </div>
        <div className="flex">
          <label htmlFor="my-drawer-5" className="drawer-button btn btn-main btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path> </svg>
          </label>
        </div>
      </div>
    );

    const footer = (
      <footer className="footer footer-horizontal footer-center bg-gray-800 text-primary-content p-10">
        <aside>
          <p className="font-bold">
            {translate(MADE_BY_FABRICE)}
          </p>
          <p>{translate(NOT_AFFILIATED)}</p>
        </aside>
        <nav>
          <div className="grid grid-flow-col gap-4">
            <a href="https://github.com/fabrice404/olympics-calendar" target="_blank">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="fill-current">
                <path d="M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z" />
              </svg>
            </a>
          </div>
        </nav>
      </footer>
    );

    let cookie = <></>;

    if (cookieConsent === 'true') {
      cookie = (
        <GoogleAnalytics gaId="G-SLBLJRE0CM" />
      );
    } else if (cookieConsent === 'null') {
      cookie = (
        <div className="sticky bottom-0 bg-gray-800 text-white text-center p-8">
          <p className="p-4">This website uses cookies for statistics purposes and to enhance the user experience.</p>
          <button className="btn btn-sm mx-2" onClick={() => setCookieConsent('true')}>Accept</button>
          <button className="btn btn-sm btn-outline" onClick={() => setCookieConsent('false')}>Decline</button>
        </div>
      );
    }

    return (
      <div>
        <div className="drawer drawer-end">
          <input id="my-drawer-5" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content">
            {header}

            {main}

            {footer}

            {cookie}
          </div>

          <div className="drawer-side">
            <label htmlFor="my-drawer-5" aria-label="close sidebar" className="drawer-overlay"></label>
            <div className="menu bg-base-200 min-h-full w-80 p-4">
              <div>
                <span className="font-bold">{translate(FILTER_BY_COUNTRY)}</span>
                {getParams().noc !== DEFAULT_NOC && (
                  <div className="my-1">
                    <a href={generateLink({ noc: DEFAULT_NOC })} className="btn bg-white btn-sm">
                      <span className="font-bold text-red-400">X</span> {translate(data.nocs.find(noc => noc.key === getParams().noc.toUpperCase())!.name)}
                    </a>
                  </div>
                )}
                <div className="bg-white h-[200px] max-h-[200px] overflow-y-scroll">
                  <ul>
                    {data.nocs.toSorted((a, b) => translate(a.name).localeCompare(translate(b.name))).map(noc => {
                      if (noc.key === getParams().noc.toUpperCase()) {
                        return (
                          <li key={noc.key}>
                            <a href={generateLink({ noc: DEFAULT_NOC })}><div aria-label="success" className="status status-success"></div> {translate(noc.name)}</a>
                          </li>
                        )
                      }
                      return (
                        <li key={noc.key}>
                          <a href={generateLink({ noc: noc.key })}>{translate(noc.name)}</a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t-1 border-slate-300">
                <span className="font-bold">{translate(FILTER_BY_SPORT)}</span>
                {getParams().sport !== DEFAULT_SPORT && (
                  <div className="my-1">
                    <a href={generateLink({ sport: DEFAULT_SPORT })} className="btn bg-white btn-sm">
                      <span className="font-bold text-red-400">X</span> {translate(data.sports.find(sport => sport.key === getParams().sport.toUpperCase())!.name)}
                    </a>
                  </div>
                )}
                <div className="bg-white h-[200px] max-h-[200px] overflow-y-scroll">
                  <ul>
                    {data.sports.toSorted((a, b) => translate(a.name).localeCompare(translate(b.name))).map(sport => {
                      if (sport.key === getParams().sport.toUpperCase()) {
                        return (
                          <li key={sport.key}>
                            <a href={generateLink({ sport: DEFAULT_SPORT })}><div aria-label="success" className="status status-success"></div> {translate(sport.name)}</a>
                          </li>
                        )
                      }
                      return (
                        <li key={sport.key}>
                          <a href={generateLink({ sport: sport.key })}>{translate(sport.name)}</a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t-1 border-slate-300">
                <span className="font-bold">{translate(FILTER_BY_EVENT_TYPE)}</span>
                {getParams().type !== DEFAULT_EVENT_TYPE && (
                  <div className="my-1">
                    <a href={generateLink({ type: DEFAULT_EVENT_TYPE })} className="btn bg-white btn-sm">
                      <span className="font-bold text-red-400">X</span> {translate(EVENT_TYPES.find(type => type.key === getParams().type.toUpperCase())?.name || {})}
                    </a>
                  </div>
                )}
                <div className="bg-white h-[100px] max-h-[100px] overflow-y-scroll">
                  <ul>
                    {EVENT_TYPES.toSorted((a, b) => translate(a.name).localeCompare(translate(b.name))).map(type => {
                      if (type.key === getParams().type.toUpperCase()) {
                        return (
                          <li key={type.key}>
                            <a href={generateLink({ type: DEFAULT_EVENT_TYPE })}><div aria-label="success" className="status status-success"></div> {translate(type.name)}</a>
                          </li>
                        )
                      }
                      return (
                        <li key={type.key}>
                          <a href={generateLink({ type: type.key })}>{translate(type.name)}</a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t-1 border-slate-300">
                <span className="font-bold">{translate(LANGUAGE)}</span>
                <div className="bg-white h-[200px] max-h-[200px] overflow-y-scroll">
                  <ul>
                    {data.languages.map(lang => {
                      if (lang.code === language) {
                        return (
                          <li key={lang.code}>
                            <a onClick={() => setLanguage(lang.code)}><div aria-label="success" className="status status-success"></div> {lang.code.toUpperCase()} - {lang.name}</a>
                          </li>
                        );
                      }
                      return (
                        <li key={lang.code}>
                          <a onClick={() => setLanguage(lang.code)}>{lang.code.toUpperCase()} - {lang.name}</a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div>Loading</div>
  );
}
