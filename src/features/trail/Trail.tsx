"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  prototypeToday,
  timelineDates,
  timelineEvents,
  tracks,
  type SessionEvent,
} from "@/mocks/data";
import { TimelineRow } from "./TimelineRow";
import { WorkoutFlow } from "@/features/workout/WorkoutFlow";

const sessions = timelineEvents.filter(
  (event): event is SessionEvent => event.type === "session",
);
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dateAtNoon = (date: string) => new Date(`${date}T12:00:00Z`);
const weekStart = (date: string) => {
  const value = dateAtNoon(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() - day + 1);
  return value.toISOString().slice(0, 10);
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
    [training, setTraining] = useState(false);
  const calendar = useRef<HTMLDivElement>(null),
    groupIndex = useRef(0);
  const frequency = useMemo(() => {
    const start = dateAtNoon(prototypeToday);
    start.setUTCDate(start.getUTCDate() - 13);
    const startDate = start.toISOString().slice(0, 10);
    return Object.fromEntries(
      tracks.map((track) => [
        track.id,
        sessions.filter(
          (session) =>
            session.track === track.id &&
            session.date >= startDate &&
            session.date <= prototypeToday,
        ).length,
      ]),
    );
  }, []);
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
          label: monthFormatter.format(dateAtNoon(date)),
          weeks: [],
        };
        months.push(month);
      }
      let week = month.weeks.at(-1);
      if (!week || week.key !== weekKey) {
        week = {
          key: weekKey,
          label: `Semana de ${fullDateFormatter.format(dateAtNoon(weekKey))}`,
          dates: [],
        };
        month.weeks.push(week);
      }
      week.dates.push(date);
    }
    return months;
  }, []);
  const goToOlderDates = () => {
    const groups = [
      ...calendar.current!.querySelectorAll<HTMLElement>(".week-group"),
    ];
    if (!groups.length) return;
    groupIndex.current = Math.min(groupIndex.current + 1, groups.length - 1);
    groups[groupIndex.current].scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
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
                <span>{frequency[track.id]} nos últimos 14 dias</span>
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
                      />
                    ))}
                  </section>
                ))}
              </section>
            ))}
          </div>
        </div>
        <button className="floating-start" onClick={() => setTraining(true)}>
          Treinar
        </button>
        <button
          className="history-next"
          onClick={goToOlderDates}
          aria-label="Ir para datas anteriores"
        >
          Datas anteriores <span aria-hidden="true">↓</span>
        </button>
      </section>
      {selected && (
        <SessionSheet session={selected} onClose={() => setSelected(null)} />
      )}{" "}
      {training && <WorkoutFlow onClose={() => setTraining(false)} />}
    </>
  );
}
