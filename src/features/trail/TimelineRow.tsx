"use client";

import { useState } from "react";
import { localDateString, tracks, type TrackId, type WorkoutSession } from "@/mocks/data";
import { ConnectionLine } from "./ConnectionLine";
import { WorkoutNode } from "./WorkoutNode";

const formatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

export function TimelineRow({ date, sessions, onSelect, onStart }: {
  date: string;
  sessions: WorkoutSession[];
  onSelect: (session: WorkoutSession) => void;
  onStart?: (tracks: TrackId[]) => void;
}) {
  const [expanded, setExpanded] = useState<TrackId | null>(null);
  const [workoutTracks, setWorkoutTracks] = useState<TrackId[]>([]);
  const today = localDateString();
  const state = date < today ? "past" : date > today ? "future" : "today";
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day, 12);

  function toggleWorkoutTrack(track: TrackId) {
    setWorkoutTracks((current) => current.includes(track) ? current.filter((item) => item !== track) : [...current, track]);
  }

  return <div className={`timeline-row is-${state} ${state === "today" && onStart ? "has-workout-picker" : ""}`} role="row" data-date={date}>
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
        {state === "today" && onStart && <button className="today-track-choice" aria-pressed={workoutTracks.includes(track.id)} aria-label={`${workoutTracks.includes(track.id) ? "Remover" : "Adicionar"} ${track.name} ${workoutTracks.includes(track.id) ? "do" : "ao"} treino`} onClick={() => toggleWorkoutTrack(track.id)}><span>{track.name}</span><small>{workoutTracks.includes(track.id) ? "Selecionado" : "Adicionar"}</small></button>}
        {list.length > 2 && <button className="expand-nodes" onClick={() => setExpanded(expanded === track.id ? null : track.id)} aria-expanded={expanded === track.id}>{expanded === track.id ? "Recolher" : `+${list.length - 2}`}</button>}
      </div>;
    })}
    {state === "today" && onStart && <div className="today-workout-action"><button className="today-start" disabled={!workoutTracks.length} onClick={() => onStart(workoutTracks)}>Iniciar treino{workoutTracks.length ? ` · ${workoutTracks.length} ${workoutTracks.length === 1 ? "trilha" : "trilhas"}` : ""}</button></div>}
  </div>;
}
