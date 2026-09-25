"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  addLocalDays,
  localDateString,
  timelineDates,
  timelineEvents,
  tracks,
  type SessionEvent,
  type TrackId,
} from "@/mocks/data";
import { TimelineRow } from "./TimelineRow";
import { WorkoutFlow } from "@/features/workout/WorkoutFlow";

const sessions = timelineEvents.filter(
  (event): event is SessionEvent => event.type === "session",
);
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});
const dateAtNoon = (date: string) => { const [y,m,d]=date.split("-").map(Number); return new Date(y,m-1,d,12); };
const weekStart = (date: string) => {
  const value = dateAtNoon(date);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return localDateString(value);
};

function SessionSheet({
  session,
  onClose,
}: {
  session: SessionEvent;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    track = tracks.find((item) => item.id === session.track)!;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement,
      root = ref.current;
    root?.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab" && root) {
        const focusable = [...root.querySelectorAll<HTMLElement>("button")];
        if (
          focusable.length &&
          ((event.shiftKey && document.activeElement === focusable[0]) ||
            (!event.shiftKey && document.activeElement === focusable.at(-1)))
        ) {
          event.preventDefault();
          focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="session-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-title"
        style={{ "--track": track.color } as CSSProperties}
      >
        <button
          className="sheet-close"
          onClick={onClose}
          aria-label="Fechar detalhes"
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="sheet-track">Trilha: {track.name}</div>
        <h2 id="session-title">{session.exercise}</h2>
        <dl>
          <div>
            <dt>Repetições por série</dt>
            <dd>{session.repsPerSet}</dd>
          </div>
          <div>
            <dt>Séries</dt>
            <dd>{session.sets}</dd>
          </div>
          <div>
            <dt>Duração</dt>
            <dd>{session.durationMinutes} min</dd>
          </div>
          <div>
            <dt>Volume total</dt>
            <dd>{session.volume} repetições</dd>
          </div>
          <div>
            <dt>Dificuldade percebida</dt>
            <dd>{session.effort}</dd>
          </div>
          <div>
            <dt>Formato</dt>
            <dd>
              {session.combinedId ? "Treino combinado" : "Treino isolado"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

export function Trail() {
  const [selected, setSelected] = useState<SessionEvent | null>(null),
    [training, setTraining] = useState<false | TrackId>(false);
  const calendar = useRef<HTMLDivElement>(null),
    todayRow = useRef<HTMLElement | null>(null),
    positioned = useRef(false);
  const today = localDateString();
  const frequency = useMemo(() => {
    const startDate = addLocalDays(today, -13);
    return Object.fromEntries(
      tracks.map((track) => [
        track.id,
        sessions.filter(
          (session) =>
            session.track === track.id &&
            session.date >= startDate &&
            session.date <= today,
        ).length,
      ]),
    );
  }, [today]);
  const recommendedTrack = tracks.reduce((best, track) => frequency[track.id] < frequency[best.id] ? track : best).id;
  useEffect(() => {
    if (positioned.current) return;
    const row = calendar.current?.querySelector<HTMLElement>(`[data-date="${today}"]`);
    if (!row) return;
    todayRow.current = row;
    positioned.current = true;
    row.scrollIntoView({ behavior: "auto", block: "start" });
  }, [today]);
  const groups = useMemo(() => {
    const months: {
      key: string;
      label: string;
      weeks: { key: string; label: string; dates: string[] }[];
    }[] = [];
    for (const date of timelineDates) {
      const monthKey = date.slice(0, 7),
        weekKey = weekStart(date);
      let month = months.at(-1);
      if (!month || month.key !== monthKey) {
        month = {
          key: monthKey,
          label: monthFormatter.format(dateAtNoon(date)).split(" de ")[0].toUpperCase(),
          weeks: [],
        };
        months.push(month);
      }
      let week = month.weeks.at(-1);
      if (!week || week.key !== weekKey) {
        week = {
          key: weekKey,
          label: `SEMANA ${month.weeks.length + 1}`,
          dates: [],
        };
        month.weeks.push(week);
      }
      week.dates.push(date);
    }
    return months;
  }, []);
  return (
    <>
      <section className="trail-page">
        <header className="timeline-header">
          <div className="timeline-brand">CALIBRE</div>
          <div className="track-headings" role="row" aria-label="Trilhas">
            <div className="date-heading" role="columnheader">
              Data
            </div>
            {tracks.map((track) => (
              <div
                role="columnheader"
                key={track.id}
                style={{ "--track": track.color } as CSSProperties}
              >
                <strong>{track.name}</strong>
                <span className="frequency-bar" aria-label={`${frequency[track.id]} treinos nos últimos 14 dias`}><i style={{width:`${Math.max(8, frequency[track.id] * 20)}%`}} /></span>
              </div>
            ))}
          </div>
        </header>
        <div className="calendar-scroll" ref={calendar}>
          <div
            className="timeline"
            role="table"
            aria-label="Histórico de treinos"
            aria-colcount={5}
          >
            {groups.map((month) => (
              <section
                className="month-group"
                role="rowgroup"
                aria-labelledby={`month-${month.key}`}
                key={month.key}
              >
                <h2 className="month-separator" id={`month-${month.key}`}>
                  {month.label}
                </h2>
                {month.weeks.map((week) => (
                  <section
                    className="week-group"
                    role="rowgroup"
                    aria-labelledby={`week-${month.key}-${week.key}`}
                    key={`${month.key}-${week.key}`}
                  >
                    <h3
                      className="week-separator"
                      id={`week-${month.key}-${week.key}`}
                    >
                      {week.label}
                    </h3>
                    {week.dates.map((date) => (
                      <TimelineRow
                        key={date}
                        date={date}
                        sessions={sessions.filter(
                          (session) => session.date === date,
                        )}
                        onSelect={setSelected}
                        onStart={(track) => setTraining(track ?? recommendedTrack)}
                        recommendedTrack={recommendedTrack}
                      />
                    ))}
                  </section>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>
      {selected && (
        <SessionSheet session={selected} onClose={() => setSelected(null)} />
      )}{" "}
      {training && <WorkoutFlow initialTrack={training} onClose={() => setTraining(false)} />}
    </>
  );
}
