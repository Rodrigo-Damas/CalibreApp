"use client";

import { useState } from "react";
import { localDateString, tracks, type TrackId, type WorkoutSession } from "@/mocks/data";
import { ConnectionLine } from "./ConnectionLine";
import { WorkoutNode } from "./WorkoutNode";

const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

export function TimelineRow({ date, sessions, onSelect }: {
  date: string;
  sessions: WorkoutSession[];
  onSelect: (session: WorkoutSession) => void;
}) {
  const [expanded, setExpanded] = useState<TrackId | null>(null);
  const today = localDateString();
  const state = date < today ? "past" : date > today ? "future" : "today";
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day, 12);

  return <div className={`timeline-row is-${state}`} role="row" data-date={date}>
    <ConnectionLine sessions={sessions} />
    <div className="date-cell" role="rowheader">
      <time dateTime={date}><span className="weekday">{formatter.format(value).replace(".", "")}</span><span className="day-number">{day}</span></time>
      {state === "today" && <span className="today-label">Hoje</span>}
    </div>
    {tracks.map((track) => {
      const list = sessions.filter((session) => session.prescriptions.some((item) => item.track === track.id)).sort((a, b) => a.time.localeCompare(b.time));
      const visible = expanded === track.id ? list : list.slice(0, 2);
      return <div className="track-slot" role="cell" key={track.id} aria-label={`${track.name}: ${list.length} sessões`}>
        <div className="node-group">{visible.map((session) => <WorkoutNode key={`${session.id}-${track.id}`} session={session} prescription={session.prescriptions.find((item) => item.track === track.id)!} onSelect={onSelect} />)}</div>
        {list.length > 2 && <button className="expand-nodes" onClick={() => setExpanded(expanded === track.id ? null : track.id)} aria-expanded={expanded === track.id}>{expanded === track.id ? "Recolher" : `+${list.length - 2}`}</button>}
      </div>;
    })}
  </div>;
}
