import type { CSSProperties } from "react";
import { tracks, type TrackId } from "@/mocks/data";
import { Check } from "lucide-react";
import { TrackIcon } from "@/components/icons/TrackIcon";

export function TrackSelector({ selected, onToggle, repeated = [] }: { selected: TrackId[]; onToggle: (id: TrackId) => void; repeated?: TrackId[] }) {
  return <div className="track-selector" aria-label="Escolha de trilhas">{tracks.map((track) => {
    const order = selected.indexOf(track.id) + 1;
    return <button key={track.id} style={{ "--track": track.color } as CSSProperties} aria-pressed={order > 0} onClick={() => onToggle(track.id)}>
      <TrackIcon track={track.id} decorative />
      <span className="track-selector__check">{order > 0 ? <b aria-label={`Selecionada na posição ${order}`}>{order}</b> : <Check aria-hidden="true" />}</span>
      <span className="track-selector__hierarchy"><strong>{track.name}</strong><small>Trilha</small></span>
      <span className="track-selector__exercise"><small>Exercício</small><strong>{track.exercise}</strong></span>
      {repeated.includes(track.id) && <span className="track-selector__repeat">Treino feito hoje</span>}
    </button>;
  })}</div>;
}
