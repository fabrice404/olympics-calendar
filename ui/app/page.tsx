"use client";

import { loadSchedule } from "../lib/data";
import { useEffect, useState } from "react";
import Flag from "./flag";
import { COPY, COPY_SUCCESS, FILTER_BY_COUNTRY, FILTER_BY_SPORT, MADE_BY_FABRICE, NOT_AFFILIATED, NO_EVENT_FOR_FILTERS } from "../lib/text";
import useLocalStorage from "@/lib/local-storage";
import { GoogleAnalytics } from "@next/third-parties/google";

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

export default function Home() {
  const qs = typeof window !== 'undefined' ? window.location.search ? new URLSearchParams(window.location.search) : new URLSearchParams() : new URLSearchParams();

  const [data, setData] = useState<Calendar | null>(null);
  const [language, setLanguage] = useLocalStorage('lang', (navigator.language || 'en').split('-')[0]);
  const [cookieConsent, setCookieConsent] = useLocalStorage('cookie-consent', 'null');

  const translate = (text: MultilingualString) => {
    return text[`${language}`] || text['en'] || Object.values(text)[0] || '';
  };

  const generateLink = ({ noc, sport, lang }: { noc?: string; sport?: string, lang?: string }) => {
    const currentParams = new URLSearchParams(qs.toString());
    if (noc !== undefined) {
      if (noc === "") {
        currentParams.delete('noc');
      } else {
        currentParams.set('noc', noc);
      }
    }

    if (sport !== undefined) {
      if (sport === "") {
        currentParams.delete('sport');
      } else {
        currentParams.set('sport', sport);
      }
    }

    if (lang !== undefined) {
      if (lang === "") {
        currentParams.delete('lang');
      } else {
        currentParams.set('lang', lang);
      }
    }
    const paramString = currentParams.toString();
    return paramString ? `./?${paramString}` : '.';
  }

  const generateCalendarLink = () => {
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const noc = (qs.get('noc') || 'calendar').toLowerCase();
    const sport = (qs.get('sport') || 'all-sports').toLowerCase();

    return `http://${host}/api/data/${language}/${sport}/${noc}.ics`;
  };

  const getColor = (i: number) => COLORS[i % COLORS.length];

  useEffect(() => {
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

    const sport = qs.get('sport');
    if (sport && event.sport !== sport) {
      visible = false;
    }

    const noc = qs.get('noc');
    if (noc) {
      if (!event.nocs.includes(noc)) {
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
            <span className="input w-1/3">
              <input type="text" placeholder={calendarLink} readOnly={true} />
              <button id="copy_button" className="label cursor-pointer" onClick={() => copyToClipboard(calendarLink)}>{translate(COPY)}</button>
            </span>

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
                  console.log(competitorId);
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
                            if (event.competitors.length === 2 || qs.get('noc') === competitor.noc) {
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

                return (
                  <div key={event.key}>
                    {dayHeader}
                    <div className="p-4 mx-2 my-4 bg-white rounded-md md:w-3/4 md:mx-auto">
                      <div className={`fg-${getColor(i)} align-top inline-block tabular-nums pr-2`}>
                        <span className="text-3xl">{startHours}:{startMinutes}</span>
                        <div className="text-xs">{endHours}:{endMinutes}</div>
                      </div>
                      <div className="align-top inline-block text-black pl-2 border-l border-slate-900/10">
                        <div className="px-2">
                          {translate(data.sports.find(sport => sport.key === event.sport)?.name || {})}
                        </div>
                        <div className={`inline-block font-bold text-sm px-2 nowrap ${titleColor}`}>{translate(event.name)}</div>
                        {competitors}
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      )
    }

    return (
      <div>
        <div className="navbar bg-main">
          <div className="navbar-start">
            <a href="." className="text-xl">Milano Cortina 2026 Winter Olympics Calendar</a>
          </div>
          <div className="navbar-end">
            <ul className="menu menu-horizontal px-2">
              <li className="px-2">
                <div className="dropdown">
                  <div tabIndex={0} role="button" className="select bg-transparent">
                    {qs.get('sport') ? (
                      <>{translate(data.sports.find((sport) => sport.key === qs.get('sport'))!.name)}</>
                    ) : (
                      <>{translate(FILTER_BY_SPORT)}</>
                    )}
                  </div>
                  <ul tabIndex={-1} className="dropdown-content menu bg-base-100 text-black rounded-box z-1 w-52 p-2 shadow-sm">
                    {data.sports.sort((a, b) => translate(a.name).localeCompare(translate(b.name))).map(sport => {
                      if (sport.key === qs.get('sport')) {
                        return (
                          <li key={sport.key}>
                            <a href={generateLink({ sport: "" })}><div aria-label="success" className="status status-success"></div> {translate(sport.name)}</a>
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
              </li>
              <li className="px-2">
                <div className="dropdown">
                  <div tabIndex={0} role="button" className="select bg-transparent">
                    {qs.get('noc') ? (
                      <>{translate(data.nocs.find((noc) => noc.key === qs.get('noc'))!.name)}</>
                    ) : (
                      <>{translate(FILTER_BY_COUNTRY)}</>
                    )}
                  </div>
                  <ul tabIndex={-1} className="dropdown-content menu bg-base-100 text-black rounded-box z-1 w-52 p-2 shadow-sm">
                    {data.nocs.sort((a, b) => translate(a.name).localeCompare(translate(b.name))).map(noc => {
                      if (noc.key === qs.get('noc')) {
                        return (
                          <li key={noc.key}>
                            <a href={generateLink({ noc: "" })}><div aria-label="success" className="status status-success"></div> {translate(noc.name)}</a>
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
              </li>
              <li className="px-2">
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost">
                    <svg className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor" d="M12 21a9 9 0 1 0 0-18m0 18a9 9 0 1 1 0-18m0 18c2.761 0 3.941-5.163 3.941-9S14.761 3 12 3m0 18c-2.761 0-3.941-5.163-3.941-9S9.239 3 12 3M3.5 9h17m-17 6h17"></path>
                    </svg>
                    <svg className="mt-px hidden size-2 fill-current opacity-60 sm:inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048"><path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path></svg>
                  </div>
                  <ul tabIndex={-1} className="menu menu-sm dropdown-content bg-base-100 text-black rounded-box z-1 mt-3 w-52 p-2 shadow">
                    {data.languages.map(lang => (
                      <li key={lang.code}>
                        <a onClick={() => setLanguage(lang.code)}>{lang.code.toUpperCase()} - {lang.name}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>
        {main}
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

        {cookieConsent === 'true' &&
          <GoogleAnalytics gaId="G-SLBLJRE0CM" />
        }

        {cookieConsent === 'null' &&
          <div className="sticky bottom-0 bg-gray-800 text-white text-center p-8">
            <p className="p-4">This website uses cookies for statistics purposes and to enhance the user experience.</p>
            <button className="btn btn-sm mx-2" onClick={() => setCookieConsent('true')}>Accept</button>
            <button className="btn btn-sm btn-outline" onClick={() => setCookieConsent('false')}>Decline</button>
          </div>
        }

      </div>
    );
  }

  return (
    <div>Loading</div>
  );
}
