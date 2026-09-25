"use client";

import { useState } from "react";
import {
  localDateString,
  tracks,
  type SessionEvent,
  type TrackId,
} from "@/mocks/data";
import { WorkoutNode } from "./WorkoutNode";
import { ConnectionLine } from "./ConnectionLine";

const ids: TrackId[] = ["push", "pull", "legs", "core"];
const formatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
});

export function TimelineRow({
  date,
  sessions,
  onSelect,
  onStart,
  recommendedTrack,
}: {
  date: string;
  sessions: SessionEvent[];
  onSelect: (session: SessionEvent) => void;
  onStart?: (track?: TrackId) => void;
  recommendedTrack?: TrackId;
}) {
  const [expanded, setExpanded] = useState<TrackId | null>(null),
    today = localDateString(),
    state = date < today ? "past" : date > today ? "future" : "today",
    parts = date.split("-").map(Number),
    localDate = new Date(parts[0], parts[1] - 1, parts[2], 12);
  return (
    <div className={`timeline-row is-${state}`} role="row" data-date={date}>
      <ConnectionLine sessions={sessions} />
      <div className="date-cell" role="rowheader">
        <time dateTime={date}>
          <span className="weekday">{formatter.format(localDate).replace(".", "")}</span>
          <span className="day-number">{localDate.getDate()}</span>
        </time>
        {state === "today" ? (
          <span className="today-label">Hoje</span>
        ) : null}
      </div>
      {ids.map((id) => {
        const list = sessions
            .filter((session) => session.track === id)
            .sort((a, b) => a.time.localeCompare(b.time)),
          visible = expanded === id ? list : list.slice(0, 2),
          track = tracks.find((item) => item.id === id)!;
        return (
          <div
            className="track-slot"
            role="cell"
            key={id}
            aria-label={`${track.name}: ${list.length} sessões`}
          >
            <div className="node-group">
              {visible.map((session) => (
                <WorkoutNode
                  key={session.id}
                  session={session}
                  onSelect={onSelect}
                />
              ))}
            </div>
            {state === "today" && !sessions.length && recommendedTrack === id && onStart && (
              <button className="today-start" onClick={() => onStart(id)}>
                Iniciar EMOM de 5 min
              </button>
            )}
            {list.length > 2 && (
              <button
                className="expand-nodes"
                onClick={() => setExpanded(expanded === id ? null : id)}
                aria-expanded={expanded === id}
              >
                {expanded === id ? "Recolher" : `+${list.length - 2}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
