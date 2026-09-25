import type { CSSProperties } from "react";
import { tracks, type SessionPrescription, type WorkoutSession } from "@/mocks/data";

export function WorkoutNode({ session, prescription, onSelect }: { session: WorkoutSession; prescription: SessionPrescription; onSelect: (session: WorkoutSession) => void }) {
  const track = tracks.find((item) => item.id === prescription.track)!;
  const interrupted = session.status === "interrupted";
  return <button className={`workout-node is-${session.status}`} style={{ "--track": track.color } as CSSProperties} onClick={() => onSelect(session)} aria-label={`${track.name}, ${session.time}, ${interrupted ? "interrompido" : `${prescription.estimatedVolume} de volume estimado`}${session.prescriptions.length > 1 ? ", treino combinado" : ""}`}>
    <span>{session.time}</span>
    <strong>{interrupted ? "—" : prescription.estimatedVolume}</strong>
    <small>{interrupted ? "Interrompido" : "estimados"}</small>
    {session.prescriptions.length > 1 && <small>Combinado</small>}
  </button>;
}
