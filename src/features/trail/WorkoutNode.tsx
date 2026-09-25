import type { CSSProperties } from "react";
import { tracks, type SessionEvent } from "@/mocks/data";
export function WorkoutNode({
  session,
  onSelect,
}: {
  session: SessionEvent;
  onSelect: (session: SessionEvent) => void;
}) {
  const track = tracks.find((item) => item.id === session.track)!;
  return (
    <button
      className={`workout-node ${session.isRecord ? "is-record" : ""}`}
      style={{ "--track": track.color } as CSSProperties}
      onClick={() => onSelect(session)}
      aria-label={`${track.name}, ${session.time}, ${session.volume} repetições${session.isRecord ? ", recorde" : ""}`}
    >
      <span>{session.time}</span>
      <strong>{session.volume}</strong>
      <small>rep.</small>
      {session.combinedId && <small>Combinado</small>}
      {session.isRecord && <small>Recorde</small>}
    </button>
  );
}
