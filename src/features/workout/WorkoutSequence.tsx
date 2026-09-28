import { tracks, type SessionPrescription, type WorkoutFormat } from "@/mocks/data";
import { sequence } from "./recommendationEngine";

export function WorkoutSequence({ prescriptions, mode }: { prescriptions: SessionPrescription[]; mode: WorkoutFormat }) {
  if (!prescriptions.length) return null;
  const order = sequence(prescriptions, prescriptions[0].sets, mode);

  return <section className="workout-sequence" aria-live="polite" aria-label="Ordem completa do treino">
    <h3>Sequência por minuto</h3>
    <ol className="sequence-strip">
      {order.map((item, index) => {
        const track = tracks.find((entry) => entry.id === item.track)!;
        const accessibleName = `Minuto ${index + 1}: ${track.name}, ${track.exercise}, ${item.repsPerSet} repetições`;
        return <li key={`${item.track}-${index}`} aria-label={accessibleName} style={{ "--track": track.color } as React.CSSProperties}>
          <span>Minuto {index + 1}</span>
          <strong>{track.exercise}</strong>
          <small>{item.repsPerSet} repetições</small>
        </li>;
      })}
    </ol>
  </section>;
}
