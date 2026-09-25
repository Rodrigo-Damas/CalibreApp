"use client";

import { useState } from "react";
import {
  prototypeToday,
  tracks,
  type SessionEvent,
  type TrackId,
} from "@/mocks/data";
import { WorkoutNode } from "./WorkoutNode";

const ids: TrackId[] = ["push", "pull", "legs", "core"];
const formatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  weekday: "short",
  timeZone: "UTC",
});

export function TimelineRow({
  date,
  sessions,
  onSelect,
}: {
  date: string;
  sessions: SessionEvent[];
  onSelect: (session: SessionEvent) => void;
}) {
  const [expanded, setExpanded] = useState<TrackId | null>(null),
    label = formatter.format(new Date(`${date}T12:00:00Z`)).replace(".", "");
  return (
    <div className="timeline-row" role="row" data-date={date}>
      <div className="date-cell" role="rowheader">
        <time dateTime={date}>{label}</time>
        {date === prototypeToday ? (
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
