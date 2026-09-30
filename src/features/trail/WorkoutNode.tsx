import type { CSSProperties } from "react";
import { Layers3, OctagonX, Trophy } from "lucide-react";
import { tracks, type SessionPrescription, type WorkoutSession } from "@/mocks/data";

export function WorkoutNode({ session, prescription, onSelect, record = false }: { session: WorkoutSession; prescription: SessionPrescription; onSelect: (session: WorkoutSession) => void; record?: boolean }) {
  const track = tracks.find((item) => item.id === prescription.track)!;
  const interrupted = session.status === "interrupted";
  const combined = session.prescriptions.length > 1;
  const elapsedMinutes = Math.floor(session.elapsedSeconds / 60);
  const elapsedSeconds = session.elapsedSeconds % 60;
  const percentage = session.completionPercentage === undefined ? "Percentual indisponível" : `${session.completionPercentage}% concluído`;
  const details = interrupted
    ? `Interrompido, ${session.completedSeries === undefined ? percentage : `${session.completedSeries} de ${session.plannedSeries} séries, ${percentage}`}, ${elapsedMinutes} min ${elapsedSeconds}s realizados`
    : `${prescription.sets} séries, ${prescription.repsPerSet} repetições por série, ${prescription.totalVolume} repetições de volume`;
  return <button className={`workout-node is-${session.status}${record ? " is-record" : ""}`} style={{ "--track": track.color } as CSSProperties} onClick={() => onSelect(session)} aria-label={`${track.name}, às ${session.time}, ${details}${combined ? ", treino combinado" : ""}${record ? ", recorde pessoal" : ""}`}>
    <span className="node-heading"><time dateTime={session.time}>{session.time}</time>{interrupted && <span className="node-status"><OctagonX aria-hidden="true" />Interrompido</span>}</span>
    {interrupted
      ? <span className="node-session-details"><strong>{session.completedSeries === undefined ? percentage : `${session.completedSeries} de ${session.plannedSeries} séries`}</strong><small>{session.completedSeries === undefined ? `${elapsedMinutes} min ${elapsedSeconds}s realizados` : percentage}</small></span>
      : <span className="node-session-details"><strong>{prescription.sets} séries</strong><small>{prescription.repsPerSet} por série</small><small>{prescription.totalVolume} de volume</small></span>}
    <span className="node-badges">{combined && <span title="Treino combinado"><Layers3 aria-hidden="true" />Combinado</span>}{record && <span title="Recorde pessoal"><Trophy aria-hidden="true" />Recorde</span>}</span>
  </button>;
}
