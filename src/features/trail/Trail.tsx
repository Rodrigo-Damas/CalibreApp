"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  addLocalDays,
  createTimelineDates,
  localDateString,
  tracks,
  type TrackId,
  type WorkoutSession,
} from "@/mocks/data";
import { useMockStore } from "@/mocks/store";
import { WorkoutFlow } from "@/features/workout/WorkoutFlow";
import { TimelineRow } from "./TimelineRow";

const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const dateAtNoon = (date: string) => {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
};
const weekStart = (date: string) => {
  const value = dateAtNoon(date);
  const day = value.getDay() || 7;
  value.setDate(value.getDate() - day + 1);
  return localDateString(value);
};

function SessionSheet({ session, onClose }: { session: WorkoutSession; onClose: () => void }) {
  const dialog = useRef<HTMLElement>(null);
  const volume = session.prescriptions.reduce((total, item) => total + (item.estimatedVolume || 0), 0);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const root = dialog.current;
    root?.querySelector<HTMLElement>("button")?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !root) return;
      const focusable = [...root.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialog} className="session-sheet" role="dialog" aria-modal="true" aria-labelledby="session-title">
        <button className="sheet-close" onClick={onClose} aria-label="Fechar resumo"><span aria-hidden="true">×</span></button>
        <p className="eyebrow">{session.status === "interrupted" ? "TREINO INTERROMPIDO" : "TREINO CONCLUÍDO"}</p>
        <h2 id="session-title">{session.prescriptions.length > 1 ? "Sessão combinada" : "Sessão individual"}</h2>
        <dl>
          <div><dt>Tempo em atividade</dt><dd>{Math.floor(session.elapsedSeconds / 60)} min {session.elapsedSeconds % 60}s</dd></div>
          <div><dt>Volume estimado total</dt><dd>{session.status === "interrupted" ? "Não estimado" : volume}</dd></div>
          {session.prescriptions.map((prescription) => {
            const track = tracks.find((item) => item.id === prescription.track)!;
            return <div key={prescription.track}><dt>{track.name}</dt><dd>{session.status === "interrupted" ? "Interrompido" : `${prescription.sets} min · ${prescription.estimatedVolume} estimados`}</dd></div>;
          })}
        </dl>
      </section>
    </div>
  );
}

export function Trail() {
  const store = useMockStore();
  const [selected, setSelected] = useState<WorkoutSession | null>(null);
  const [training, setTraining] = useState<false | TrackId>(false);
  const calendar = useRef<HTMLDivElement>(null);
  const positioned = useRef(false);
  const today = localDateString();
  const dates = useMemo(() => createTimelineDates(today), [today]);
  const frequency = useMemo(() => {
    const startDate = addLocalDays(today, -13);
    return Object.fromEntries(tracks.map((track) => [
      track.id,
      store.sessions.filter((session) => session.date >= startDate && session.date <= today && session.prescriptions.some((item) => item.track === track.id)).length,
    ])) as Record<TrackId, number>;
  }, [store.sessions, today]);
  const recommendedTrack = tracks.reduce((best, track) => frequency[track.id] < frequency[best.id] ? track : best).id;
  const groups = useMemo(() => {
    const months: { key: string; label: string; weeks: { key: string; label: string; dates: string[] }[] }[] = [];
    for (const date of dates) {
      const monthKey = date.slice(0, 7);
      const weekKey = weekStart(date);
      let month = months.at(-1);
      if (!month || month.key !== monthKey) {
        month = { key: monthKey, label: monthFormatter.format(dateAtNoon(date)).split(" de ")[0].toUpperCase(), weeks: [] };
        months.push(month);
      }
      let week = month.weeks.at(-1);
      if (!week || week.key !== weekKey) {
        week = { key: weekKey, label: `SEMANA ${month.weeks.length + 1}`, dates: [] };
        month.weeks.push(week);
      }
      week.dates.push(date);
    }
    return months;
  }, [dates]);

  useEffect(() => {
    if (positioned.current) return;
    const row = calendar.current?.querySelector<HTMLElement>(`[data-date="${today}"]`);
    if (!row) return;
    positioned.current = true;
    row.scrollIntoView({ behavior: "auto", block: "end" });
  }, [today]);

  return <>
    <section className="trail-page" aria-busy={!store.hydrated}>
      <header className="timeline-header">
        <div className="timeline-brand">CALIBRE · JORNADA</div>
        <div className="track-headings" role="row" aria-label="Cabeçalhos fixos das trilhas">
          <div className="date-heading" role="columnheader">Data</div>
          {tracks.map((track) => <div role="columnheader" key={track.id} style={{ "--track": track.color } as CSSProperties}>
            <strong>{track.name}</strong>
            <span className="frequency-bar" aria-label={`${frequency[track.id]} treinos nos últimos 14 dias`}><i style={{ width: `${Math.max(8, frequency[track.id] * 20)}%` }} /></span>
          </div>)}
        </div>
      </header>
      <div className="calendar-scroll" ref={calendar}>
        <div className="timeline" role="table" aria-label="Histórico de treinos" aria-colcount={5}>
          {groups.map((month) => <section className="month-group" role="rowgroup" aria-labelledby={`month-${month.key}`} key={month.key}>
            <h2 className="month-separator" id={`month-${month.key}`}>{month.label}</h2>
            {month.weeks.map((week) => <section className="week-group" role="rowgroup" aria-labelledby={`week-${month.key}-${week.key}`} key={`${month.key}-${week.key}`}>
              <h3 className="week-separator" id={`week-${month.key}-${week.key}`}>{week.label}</h3>
              {week.dates.map((date) => <TimelineRow key={date} date={date} sessions={store.sessions.filter((session) => session.date === date)} onSelect={setSelected} onStart={(track) => setTraining(track ?? recommendedTrack)} recommendedTrack={recommendedTrack} />)}
            </section>)}
          </section>)}
        </div>
      </div>
    </section>
    {selected && <SessionSheet session={selected} onClose={() => setSelected(null)} />}
    {training && <WorkoutFlow initialTrack={training} onClose={() => setTraining(false)} />}
  </>;
}
