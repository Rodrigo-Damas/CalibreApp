import type { CSSProperties } from "react";
import { Layers3, OctagonX, Trophy } from "lucide-react";
import { tracks, type SessionPrescription, type WorkoutSession } from "@/mocks/data";

export function WorkoutNode({ session, prescription, onSelect }: { session: WorkoutSession; prescription: SessionPrescription; onSelect: (session: WorkoutSession) => void }) {
  const track = tracks.find((item) => item.id === prescription.track)!;
  const interrupted = session.status === "interrupted";
  const combined = session.prescriptions.length > 1;
  const record = !interrupted && ["light", "spare"].includes(session.perception ?? "");
  return <button className={`workout-node is-${session.status}${record ? " is-record" : ""}`} style={{ "--track": track.color } as CSSProperties} onClick={() => onSelect(session)} aria-label={`${track.name}, às ${session.time}, ${interrupted ? "treino interrompido" : `${prescription.estimatedVolume} repetições`}${combined ? ", treino combinado" : ""}${record ? ", recorde pessoal" : ""}`}>
    <time dateTime={session.time}>{session.time}</time>
    {interrupted ? <span className="node-status"><OctagonX aria-hidden="true" />Interrompido</span> : <strong>{prescription.estimatedVolume} <small>reps</small></strong>}
    <span className="node-badges">{combined && <span title="Treino combinado"><Layers3 aria-hidden="true" />Combinado</span>}{record && <span title="Recorde pessoal"><Trophy aria-hidden="true" />Recorde</span>}</span>
  </button>;
}
