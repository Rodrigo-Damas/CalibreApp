"use client";
import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import { tracks, type TrackId } from "@/mocks/data";
import { TrackIcon } from "@/components/icons/TrackIcon";
import { TrackSelector } from "./TrackSelector";
import { WorkoutSequence, type SequenceNode } from "./WorkoutSequence";
import { EmomTimer } from "./EmomTimer";
type Duration = "short" | "long"; type Mode = "blocks" | "circuit"; type Intensity = "Leve" | "Normal" | "Forte";

export function WorkoutFlow({ onClose, initialTrack }: { onClose: () => void; initialTrack?: TrackId }) {
  const [selected, setSelected] = useState<TrackId[]>(initialTrack ? [initialTrack] : []), [choosing, setChoosing] = useState(!initialTrack);
  const [duration, setDuration] = useState<Duration | null>(initialTrack ? "short" : null), [mode, setMode] = useState<Mode>("blocks");
  const [intensity, setIntensity] = useState<Intensity>("Normal"), [intensityOpen, setIntensityOpen] = useState(false), [running, setRunning] = useState(false), [complete, setComplete] = useState(false);
  const count = duration === "long" ? 10 : 5;
  const base = useMemo(() => selected.flatMap(track => Array.from({ length: count }, (_, ordinal): SequenceNode => ({ id: `${track}-${ordinal}`, track, ordinal, reps: tracks.find(t => t.id === track)!.recommendation }))), [selected, count]);
  const nodes = mode === "blocks" ? base : [...Array(count)].flatMap((_, i) => selected.map(track => base.find(n => n.track === track && n.ordinal === i)!));
  const finish = useCallback(() => setComplete(true), []);
  function toggle(id: TrackId) { setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 4 ? [...s, id] : s); }
  const minutes = selected.length * (duration === "long" ? 10 : 5), practice = tracks.find(track => track.id === selected[0]);
  return <div className="workout-builder" role="dialog" aria-modal="true" aria-label="Montar treino"><header><div><small>NOVO TREINO</small><h1>Monte seu ritmo</h1></div><button onClick={onClose} aria-label="Fechar"><X /></button></header><main>
    {complete ? <section className="builder-step completion-step"><p className="step-label">TREINO CONCLUÍDO</p><h2>Como foi o esforço?</h2>{(["Leve", "Normal", "Forte"] as Intensity[]).map(value => <button className="effort-button" key={value} onClick={onClose}>{value}</button>)}</section>
    : running && practice ? <EmomTimer exercise={practice.exercise} reps={practice.recommendation} onFinish={finish} />
    : choosing ? <section className="builder-step"><p className="step-label">1 · Escolha de uma a quatro trilhas</p><h2>O que você quer mover?</h2><TrackSelector selected={selected} onToggle={toggle}/><p className="suggestion">Sugestão: Puxar + Core</p><button className="primary-button" disabled={!selected.length} onClick={() => setChoosing(false)}>Continuar</button></section>
    : !duration ? <section className="builder-step"><button className="back-link" onClick={() => setChoosing(true)}>← Alterar trilhas</button><p className="step-label">2 · Duração</p><h2>Quanto tempo você tem?</h2><div className="duration-options"><button onClick={() => setDuration("short")}><span className="duration-nodes">{selected.map(id => <i key={id}><TrackIcon track={id}/><b>5</b></i>)}</span><strong>Curto</strong><small>{selected.length * 5} min · 5 nós por trilha</small></button><button onClick={() => setDuration("long")}><span className="duration-nodes">{selected.map(id => <i key={id}><TrackIcon track={id}/><b>10</b></i>)}</span><strong>Longo</strong><small>{selected.length * 10} min · 10 nós por trilha</small></button></div></section>
    : <section className="builder-step sequence-step"><div className="workout-summary"><div><p className="step-label">3 · Seu treino</p><h2>{minutes} minutos · {nodes.length} nós</h2></div><button className="back-link" onClick={() => setDuration(null)}>Alterar duração</button></div><div className="mode-switch" aria-label="Formato do treino"><button aria-pressed={mode === "blocks"} onClick={() => setMode("blocks")}>Blocos</button><button aria-pressed={mode === "circuit"} onClick={() => setMode("circuit")}>Circuito</button></div><div className="track-legend" aria-label="Legenda das trilhas">{selected.map(id => { const track = tracks.find(x => x.id === id)!; return <span key={id}><TrackIcon track={id}/>{track.name}</span>; })}</div><WorkoutSequence nodes={nodes} mode={mode}/><div className="builder-actions"><div className="intensity-control"><button aria-expanded={intensityOpen} onClick={() => setIntensityOpen(v => !v)}>Intensidade: {intensity} ›</button>{intensityOpen && <div role="menu" aria-label="Escolher intensidade">{(["Leve", "Normal", "Forte"] as Intensity[]).map(value => <button role="menuitemradio" aria-checked={intensity === value} key={value} onClick={() => { setIntensity(value); setIntensityOpen(false); }}>{value}</button>)}</div>}</div><button className="primary-button" onClick={() => setRunning(true)}>Iniciar treino</button></div></section>}
  </main></div>;
}
