import { tracks, type SessionPrescription, type WorkoutFormat } from "@/mocks/data";
import { sequence } from "./recommendationEngine";

export function WorkoutSequence({ prescriptions, mode }: { prescriptions: SessionPrescription[]; mode: WorkoutFormat }) {
  const items = sequence(prescriptions, prescriptions[0]?.sets || 5, mode);
  return <details className="sequence-details">
    <summary>Ver ordem dos exercícios</summary>
    <ol aria-label={`Ordem em ${mode === "blocks" ? "Blocos" : "Circuito"}`}>
      {items.map((item, index) => <li key={`${item.track}-${index}`}><span>{index + 1}</span><strong>{tracks.find((track) => track.id === item.track)!.name}</strong><span>{item.displayedReps} repetições</span></li>)}
    </ol>
  </details>;
}
