import type { CSSProperties } from "react";
import { tracks, type TrackId } from "@/mocks/data";
import { Check } from "lucide-react";
import { TrackIcon } from "@/components/icons/TrackIcon";

export function TrackSelector({ selected, onToggle, repeated = [] }: { selected: TrackId[]; onToggle: (id: TrackId) => void; repeated?: TrackId[] }) {
  return <div className="track-selector" aria-label="Escolha de trilhas">{tracks.map((track) => {
    const active = selected.includes(track.id);
    return <button key={track.id} style={{ "--track": track.color } as CSSProperties} aria-pressed={active} onClick={() => onToggle(track.id)}>
      <TrackIcon track={track.id} decorative />
      <span className="track-selector__check"><Check aria-hidden="true" /><span>{active ? "Selecionado" : "Selecionar"}</span></span>
      <strong>{track.name}</strong>
      <small>{track.exercise}</small>
      {repeated.includes(track.id) && <span className="track-selector__repeat">Treinada hoje</span>}
    </button>;
  })}</div>;
}
