import type { CSSProperties } from "react";
import { tracks, type TrackId } from "@/mocks/data";

export function TrackSelector({ selected, onToggle, repeated = [] }: { selected: TrackId[]; onToggle: (id: TrackId) => void; repeated?: TrackId[] }) {
  return <div className="track-selector" aria-label="Escolha de trilhas">{tracks.map((track) => {
    const order = selected.indexOf(track.id) + 1;
    return <button key={track.id} style={{ "--track": track.color } as CSSProperties} aria-pressed={order > 0} onClick={() => onToggle(track.id)}>
      {order > 0 && <b className="track-selector__order" aria-label={`Selecionada na posição ${order}`}>{order}</b>}
      <span className="track-selector__hierarchy"><strong>{track.name}</strong><small>Trilha</small></span>
      <span className="track-selector__exercise"><small>Exercício</small><strong>{track.exercise}</strong></span>
      {repeated.includes(track.id) && <span className="track-selector__repeat">Treino feito hoje</span>}
    </button>;
  })}</div>;
}
