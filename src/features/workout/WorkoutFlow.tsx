"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, X } from "lucide-react";
import { tracks, localDateString, type DurationChoice, type Perception, type TrackId, type WorkoutFormat, type WorkoutSession } from "@/mocks/data";
import { useMockStore } from "@/mocks/store";
import { contextualMessage, isLargeIncrease, makePrescription, recommend, SETS } from "./recommendationEngine";
import { TrackSelector } from "./TrackSelector";
import { WorkoutSequence } from "./WorkoutSequence";
import { WorkoutTimer } from "./EmomTimer";
import { WorkoutPulse } from "./WorkoutPulse";

type Step = "tracks" | "build" | "running" | "pulse" | "done";

export function WorkoutFlow({ onClose, initialTrack, initialTracks }: { onClose: () => void; initialTrack?: TrackId; initialTracks?: TrackId[] }) {
  const store = useMockStore();
  const startingTracks = initialTracks ?? (initialTrack ? [initialTrack] : []);
  const [step, setStep] = useState<Step>(startingTracks.length ? "build" : "tracks");
  const [selected, setSelected] = useState<TrackId[]>(startingTracks);
  const [duration, setDuration] = useState<DurationChoice>("short");
  const [format, setFormat] = useState<WorkoutFormat>("blocks");
  const [chosen, setChosen] = useState<Partial<Record<TrackId, number>>>({});
  const [pending, setPending] = useState<WorkoutSession | null>(null);
  const [milestones, setMilestones] = useState<string[]>([]);
  const today = localDateString();
  const repeated = tracks.filter((track) => store.sessions.some((session) => session.date === today && session.prescriptions.some((item) => item.track === track.id))).map((track) => track.id);
  const recommendations = useMemo(() => Object.fromEntries(tracks.map((track) => [track.id, recommend(track.id, track.initialShortRecommendation, store.sessions)])) as Record<TrackId, ReturnType<typeof recommend>>, [store.sessions]);
  const prescriptions = selected.map((id) => {
    const track = tracks.find((item) => item.id === id)!;
    const suggestion = recommendations[id].value;
    return makePrescription(id, track.exerciseKey, suggestion, chosen[id] ?? suggestion, duration);
  });

  function toggle(id: TrackId) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  }
  function changeReps(id: TrackId, delta: number) {
    setChosen((value) => ({ ...value, [id]: Math.max(1, (value[id] ?? recommendations[id].value) + delta) }));
  }
  function begin() {
    const now = new Date();
    const id = `session-${now.getTime()}`;
    setPending({ id, combinedId: id, date: today, time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), duration, format, arrival: "normal", plannedMinutes: selected.length * SETS[duration], elapsedSeconds: 0, status: "completed", prescriptions });
    setStep("running");
  }
  function interrupt(seconds: number) {
    if (!pending) return;
    store.completeSession({ ...pending, status: "interrupted", elapsedSeconds: seconds, prescriptions: pending.prescriptions.map((item) => ({ ...item, estimatedVolume: undefined })) });
    onClose();
  }
  function complete(perception: Perception) {
    if (!pending) return;
    const finished = { ...pending, perception, elapsedSeconds: pending.plannedMinutes * 60 } as WorkoutSession;
    const wins: string[] = [];
    for (const dose of finished.prescriptions) {
      const track = tracks.find((item) => item.id === dose.track)!;
      const past = store.sessions.filter((session) => session.status === "completed").flatMap((session) => session.prescriptions.filter((item) => item.track === dose.track));
      if (!past.length || dose.chosenShortReps > Math.max(...past.map((item) => item.chosenShortReps))) wins.push(`Novo ponto mais alto: ${dose.chosenShortReps} por série.`);
      if (!past.length || (dose.estimatedVolume || 0) > Math.max(...past.map((item) => item.estimatedVolume || 0))) wins.push(`Seu maior volume estimado em ${track.name}: ${dose.estimatedVolume} movimentos.`);
    }
    store.completeSession(finished); setMilestones(wins); setStep("done");
  }

  const stepNumber = step === "tracks" ? 1 : 2;
  return <div className={`workout-builder${step === "running" ? " timer-active" : ""}`} role="dialog" aria-modal="true" aria-label={step === "running" ? "Cronômetro" : "Montar treino"} data-reduced-motion={store.preferences.reducedMotion || undefined}>
    {step !== "running" && <header className="builder-header">
      <button className="builder-header__back" onClick={() => setStep("tracks")} aria-label="Voltar" disabled={step !== "build"}><ArrowLeft aria-hidden="true" /></button>
      <div className="builder-header__title"><h1>Montar treino</h1><div className="builder-progress" aria-label={`Etapa ${stepNumber} de 2`}>{[1, 2].map((item) => <i key={item} className={item <= stepNumber ? "is-filled" : ""} />)}</div></div>
      <button onClick={onClose} aria-label="Fechar"><X aria-hidden="true" /></button>
    </header>}
    <main>
      {step === "tracks" && <section className="builder-step"><p className="step-label">Etapa 1 de 2</p><h2>Escolha as trilhas</h2><TrackSelector selected={selected} onToggle={toggle} repeated={repeated} />{selected.some((item) => repeated.includes(item)) && <aside className="recovery-note">Treinada hoje. Você pode fazer outra sessão.</aside>}<button className="primary-button" disabled={!selected.length} onClick={() => setStep("build")}>Continuar</button></section>}
      {step === "build" && <section className="builder-step build-sheet"><header><p className="step-label">Seu treino</p><h2>{selected.map((id) => tracks.find((track) => track.id === id)!.name).join(" · ")}</h2></header>
        <section className="build-section" aria-labelledby="duration-title"><h3 id="duration-title">Defina a duração</h3><div className="duration-segmented" role="group" aria-label="Duração do treino">{(["short", "long"] as DurationChoice[]).map((choice) => <button key={choice} aria-pressed={duration === choice} onClick={() => setDuration(choice)}><strong>{choice === "short" ? "Curto" : "Longo"}</strong><small>{SETS[choice]} séries por trilha</small></button>)}</div></section>
        {selected.length > 1 && <section className="build-section"><h3>Escolha o formato</h3><div className="format-segmented" role="group" aria-label="Formato do treino"><button aria-pressed={format === "blocks"} onClick={() => setFormat("blocks")}><strong>Blocos</strong><span>Uma trilha por vez</span></button><button aria-pressed={format === "circuit"} onClick={() => setFormat("circuit")}><strong>Circuito</strong><span>Alternar exercícios</span></button></div></section>}
        <section className="build-section prescription-section"><h3>Exercícios</h3><div className="prescription-list">{prescriptions.map((prescription) => { const track = tracks.find((item) => item.id === prescription.track)!; const known = store.sessions.flatMap((session) => session.prescriptions.filter((item) => item.track === prescription.track).map((item) => item.chosenShortReps)); return <article key={prescription.track} style={{ "--track": track.color } as CSSProperties}><div className="prescription-heading"><small>{track.name}</small><h4>{track.exercise}</h4><p><strong>{prescription.sets} séries × {prescription.displayedReps} repetições</strong><span>{prescription.estimatedVolume} repetições estimadas</span></p></div><div className="dose-control"><button aria-label={`Diminuir repetições de ${track.name}`} onClick={() => changeReps(track.id, -1)}>−</button><strong aria-label={`${prescription.displayedReps} repetições por série`}>{prescription.displayedReps}</strong><button aria-label={`Aumentar repetições de ${track.name}`} onClick={() => changeReps(track.id, 1)}>+</button></div><p className="context-message">{contextualMessage(prescription.suggestedShortReps, prescription.chosenShortReps, known)}</p>{isLargeIncrease(prescription.suggestedShortReps, prescription.chosenShortReps) && <button className="reset-suggestion" onClick={() => setChosen((value) => ({ ...value, [track.id]: prescription.suggestedShortReps }))}>Voltar à sugestão</button>}</article>; })}</div></section>
        <section className="build-section build-summary" aria-live="polite"><h3>Resumo</h3><strong>{selected.length * SETS[duration]} minutos estimados</strong><span>{selected.length > 1 ? (format === "blocks" ? "Em blocos" : "Em circuito") : "Trilha individual"} · {prescriptions.reduce((sum, item) => sum + (item.estimatedVolume ?? 0), 0)} repetições estimadas</span><WorkoutSequence prescriptions={prescriptions} mode={format} /></section>
        <div className="builder-sticky-action"><button className="primary-button" onClick={begin}>Começar treino</button></div>
      </section>}
      {step === "running" && pending && <WorkoutTimer prescriptions={pending.prescriptions} format={pending.format} preferences={store.preferences} updatePreferences={store.updatePreferences} onFinish={() => setStep("pulse")} onInterrupt={interrupt} />}
      {step === "pulse" && <WorkoutPulse onConfirm={complete} />}
      {step === "done" && pending && <section className="builder-step completion-step"><h2>Treino concluído</h2><dl><div><dt>Duração</dt><dd>{pending.plannedMinutes} min</dd></div><div><dt>Trilhas</dt><dd>{pending.prescriptions.map((item) => tracks.find((track) => track.id === item.track)!.name).join(", ")}</dd></div><div><dt>Volume total</dt><dd>{pending.prescriptions.reduce((sum, item) => sum + (item.estimatedVolume ?? 0), 0)} repetições</dd></div></dl>{milestones.length > 0 && <ul>{milestones.map((milestone) => <li key={milestone}>{milestone}</li>)}</ul>}<button className="primary-button" onClick={onClose}>Voltar para a agenda</button></section>}
    </main>
  </div>;
}
