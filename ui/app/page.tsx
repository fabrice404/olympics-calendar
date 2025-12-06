"use client";

import { loadSchedule } from "../lib/data";
import { useEffect, useState } from "react";
import Flag from "./flag";
import { COPY, COPY_SUCCESS, FILTER_BY_COUNTRY, FILTER_BY_SPORT } from "../lib/text";
import useLocalStorage from "@/lib/local-storage";

interface MultilingualString {
  [key: string]: string;
}

interface Language {
  code: string;
  name: string;
}

interface Sport {
  key: string;
  name: MultilingualString
}

interface Team {
  key: string;
  name: MultilingualString;
}

interface Match {
  team1: Team;
  team2: Team;
}

interface Event {
  key: string;
  start: string;
  end: string;
  sport: string;
  isTraining: boolean;
  medal: '0' | '1' | '3';
  name: MultilingualString;
  match?: Match;
}

interface Calendar {
  languages: Language[];
  sports: Sport[];
  events: Event[];
  nocs: Team[];
}

const COLORS = ['azzurro', 'giallo', 'rosa', 'rosso', 'verde', 'viola'];

export default function Home() {
  const qs = typeof window !== 'undefined' ? window.location.search ? new URLSearchParams(window.location.search) : new URLSearchParams() : new URLSearchParams();

  const [data, setData] = useState<Calendar | null>(null);
  const [language, setLanguage] = useLocalStorage('lang', (navigator.language || 'en').split('-')[0]);

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
      if (event.match) {
        if (event.match.team1.key !== noc && event.match.team2.key !== noc) {
          visible = false;
        }
      } else {
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
          // document.getElementById('copy_toast')?.classList.remove('toast-open');
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
            data.events
              .filter(event => filter(event))
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((event, i) => {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                const startHours = startDate.getHours().toString().padStart(2, '0');
                const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
                const endHours = endDate.getHours().toString().padStart(2, '0');
                const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

                const participants = [];

                let titleColor = "fg-main";
                if (event.medal === '1') {
                  titleColor = "bg-gold";
                } else if (event.medal === '3') {
                  titleColor = "bg-bronze";
                }

                if (event.match) {
                  participants.push(event.match.team1.key);
                  participants.push(event.match.team2.key);
                }

                const day = event.start.split('T')[0];
                let dayHeader = <></>;

                if (lastDay !== day) {
                  dayHeader = (
                    <div className="day-header text-center my-8">
                      <h2 className="text-3xl font-light fg-main">
                        {new Date(day).toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </h2>
                    </div>
                  );
                }
                lastDay = day;

                return (
                  <div key={event.key}>
                    {dayHeader}
                    <div className="py-4 mx-auto my-4 bg-white w-3/4 rounded-lg">
                      <div className={`fg-${getColor(i)} w-1/4 align-top text-right inline-block text-5xl tabular-nums pr-2 border-r border-slate-900/10`}>
                        <span className="time-start">{startHours}:{startMinutes}</span>
                        <div className="time-end text-xs">{endHours}:{endMinutes}</div>
                      </div>
                      <div className="w-3/5 align-top inline-block text-black pl-2">
                        <div className="px-2">
                          {translate(data.sports.find(sport => sport.key === event.sport)?.name || {}).toUpperCase()}
                        </div>
                        <div className={`font-bold inline-block px-2 ${titleColor}`}>{translate(event.name)}</div>
                        {event.match?.team1?.key && event.match?.team2.key && (
                          <div className="competitors min-w-md max-w-md px-2 font-light">
                            <div className="w-1/3 inline-block">
                              {translate(event.match.team1.name)}
                            </div>

                            <div className="w-1/9 inline-block">
                              <Flag iso3={event.match.team1.key} name={translate(event.match.team1.name)} />
                            </div>
                            <div className="w-1/9 inline-block text-center">-</div>

                            <div className="w-1/9 inline-block text-right">
                              <Flag iso3={event.match.team2.key} name={translate(event.match.team2.name)} />
                            </div>

                            <div className="w-1/3 inline-block text-right">
                              {translate(event.match.team2.name)}
                            </div>

                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div >
    );
  }

  return (
    <div>Loading</div>
  );
}
