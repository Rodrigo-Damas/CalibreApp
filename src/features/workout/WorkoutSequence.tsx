import { tracks, type SessionPrescription, type WorkoutFormat } from "@/mocks/data";

export function WorkoutSequence({ prescriptions, mode }: { prescriptions: SessionPrescription[]; mode: WorkoutFormat }) {
  if (!prescriptions.length) return null;
  return <section className="workout-sequence" aria-live="polite" aria-label="Sequência do treino">
    <h3>Sequência do treino</h3>
    {mode === "blocks" ? <ol className="sequence-groups">
      {prescriptions.map((item, index) => { const track = tracks.find((entry) => entry.id === item.track)!; return <li key={item.track}>
        <strong>{index + 1}. {track.name} — {track.exercise}</strong>
        <span>{item.sets} séries agrupadas · {item.repsPerSet} repetições por série</span>
      </li>; })}
    </ol> : <ol className="sequence-rounds">
      {Array.from({ length: prescriptions[0].sets }, (_, round) => <li key={round}>
        <strong>Rodada {round + 1}</strong>
        <ol>{prescriptions.map((item, index) => { const track = tracks.find((entry) => entry.id === item.track)!; return <li key={item.track}>{index + 1}. {track.name} — {track.exercise} · {item.repsPerSet} repetições</li>; })}</ol>
      </li>)}
    </ol>}
  </section>;
}
