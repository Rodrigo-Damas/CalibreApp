"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, X, Zap } from "lucide-react";
import { TrackIcon } from "@/components/icons/TrackIcon";
import { tracks, localDateString, type Arrival, type DurationChoice, type Perception, type TrackId, type WorkoutFormat, type WorkoutSession } from "@/mocks/data";
import { useMockStore } from "@/mocks/store";
import { arrivalAdjustment, contextualMessage, isLargeIncrease, makePrescription, recommend, SETS } from "./recommendationEngine";
import { TrackSelector } from "./TrackSelector";
import { WorkoutSequence } from "./WorkoutSequence";
import { WorkoutTimer } from "./EmomTimer";
import { WorkoutPulse } from "./WorkoutPulse";

const arrivals: [Arrival, string][] = [["empty", "Sem energia"], ["slow", "Devagar"], ["normal", "Normal"], ["ready", "Disposto"], ["whole", "Inteiro"]];
type Step = "tracks" | "arrival" | "duration" | "format" | "review" | "running" | "pulse" | "done";

export function WorkoutFlow({ onClose, initialTrack, initialTracks }: { onClose: () => void; initialTrack?: TrackId; initialTracks?: TrackId[] }) {
  const store = useMockStore();
  const startingTracks = initialTracks ?? (initialTrack ? [initialTrack] : []);
  const [step, setStep] = useState<Step>(startingTracks.length ? "arrival" : "tracks");
  const [selected, setSelected] = useState<TrackId[]>(startingTracks);
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const [duration, setDuration] = useState<DurationChoice>("short");
  const [format, setFormat] = useState<WorkoutFormat>("blocks");
  const [chosen, setChosen] = useState<Partial<Record<TrackId, number>>>({});
  const [pending, setPending] = useState<WorkoutSession | null>(null);
  const [milestones, setMilestones] = useState<string[]>([]);
  const today = localDateString();
  const repeated = tracks.filter((track) => store.sessions.some((session) => session.date === today && session.prescriptions.some((item) => item.track === track.id))).map((track) => track.id);
  const recommendations = useMemo(() => Object.fromEntries(tracks.map((track) => [track.id, recommend(track.id, track.initialShortRecommendation, store.sessions)])) as Record<TrackId, ReturnType<typeof recommend>>, [store.sessions]);
  const stepNumber = ({ tracks: 1, arrival: 2, duration: 3, format: 4, review: 5, pulse: 5, done: 5 } as Partial<Record<Step, number>>)[step] ?? 1;

  function goBack() {
    const previous: Partial<Record<Step, Step>> = { arrival: "tracks", duration: "arrival", format: "duration", review: selected.length > 1 ? "format" : "duration" };
    const destination = previous[step];
    if (destination) setStep(destination);
  }

  function toggle(id: TrackId) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 4 ? [...current, id] : current);
  }
  function selectArrival(value: Arrival) {
    setArrival(value);
    const delta = arrivalAdjustment[value];
    setChosen(Object.fromEntries(selected.map((id) => [id, Math.max(1, recommendations[id].value + delta)])));
    setStep("duration");
  }

  const previewPrescriptions = selected.map((id) => {
    const track = tracks.find((item) => item.id === id)!;
    const suggestion = Math.max(1, recommendations[id].value + arrivalAdjustment[arrival || "normal"]);
    return makePrescription(id, track.exerciseKey, suggestion, chosen[id] ?? suggestion, duration);
  });
  const prescriptions = previewPrescriptions;

  function begin() {
    const now = new Date();
    const id = `session-${now.getTime()}`;
    setPending({ id, combinedId: id, date: today, time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), duration, format, arrival: arrival!, plannedMinutes: selected.length * SETS[duration], elapsedSeconds: 0, status: "completed", prescriptions });
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
    store.completeSession(finished);
    setMilestones(wins);
    setStep("done");
  }

  return <div className={`workout-builder${step === "running" ? " timer-active" : ""}`} role="dialog" aria-modal="true" aria-label={step === "running" ? "Cronômetro" : "Montar treino"} data-reduced-motion={store.preferences.reducedMotion || undefined}>
    {step !== "running" && <header className="builder-header">
      <button className="builder-header__back" onClick={goBack} aria-label="Voltar" disabled={step === "tracks" || step === "pulse" || step === "done"}><ArrowLeft aria-hidden="true" /></button>
      <div className="builder-header__title"><small>NOVO TREINO</small><h1>Monte seu ritmo</h1><div className="builder-progress" aria-label={`Etapa ${stepNumber} de 5`}>{[1, 2, 3, 4, 5].map((item) => <i key={item} className={item <= stepNumber ? "is-filled" : ""} />)}</div></div>
      <button onClick={onClose} aria-label="Fechar"><X aria-hidden="true" /></button>
    </header>}
    <main>
      {step === "tracks" && <section className="builder-step"><p className="step-label">1 · TRILHAS</p><h2>O que entra neste treino?</h2><TrackSelector selected={selected} onToggle={toggle} repeated={repeated} />{selected.some((item) => repeated.includes(item)) && <aside className="recovery-note">Você já treinou esta trilha hoje. Mais uma sessão pode cobrar bastante do mesmo movimento. Quer continuar? A escolha é sua.</aside>}<button className="primary-button" disabled={!selected.length} onClick={() => setStep("arrival")}>Continuar</button></section>}
      {step === "arrival" && <section className="builder-step arrival-step"><p className="step-label">2 · CONDIÇÃO</p><h2>Quanto você tem no tanque hoje?</h2><p className="energy-hint">Toque no nível que melhor representa sua energia agora.</p><div className="energy-battery" role="radiogroup" aria-label="Nível de energia">{arrivals.map(([id, label], index) => <button role="radio" aria-checked={arrival === id} aria-label={label} key={id} onClick={() => selectArrival(id)} style={{ "--energy-level": index + 1 } as CSSProperties}><span className="energy-cell" aria-hidden="true" /><strong>{label}</strong></button>)}<span className="battery-bolt" aria-hidden="true"><Zap /></span></div></section>}
      {step === "duration" && <section className="builder-step duration-step"><p className="step-label">3 · DURAÇÃO</p><h2>Escolha um ritmo para todas as trilhas</h2><div className="duration-segmented" role="group" aria-label="Duração do treino">{(["short", "long"] as DurationChoice[]).map((choice) => <button key={choice} aria-pressed={duration === choice} onClick={() => setDuration(choice)}>{choice === "short" ? "Curto" : "Longo"}</button>)}</div><section className="duration-preview" aria-live="polite" aria-label="Prévia do treino"><header><strong>{selected.length * SETS[duration]} minutos no total</strong><span>{SETS[duration]} séries por trilha</span></header><div className="preview-table" role="table" aria-label="Resumo por trilha"><div role="row" className="preview-heading"><span role="columnheader">Trilha</span><span role="columnheader">Séries</span><span role="columnheader">Repetições</span><span role="columnheader">Volume</span></div>{previewPrescriptions.map((prescription) => <div role="row" key={prescription.track}><strong role="cell">{tracks.find((track) => track.id === prescription.track)!.name}</strong><span role="cell">{prescription.sets} min</span><span role="cell">{prescription.displayedReps} por série</span><span role="cell">{prescription.estimatedVolume}</span></div>)}</div><WorkoutSequence prescriptions={previewPrescriptions} mode={format} /></section><button className="primary-button" onClick={() => setStep(selected.length > 1 ? "format" : "review")}>Continuar</button></section>}
      {step === "format" && <section className="builder-step"><p className="step-label">4 · FORMATO</p><h2>Como as trilhas se alternam?</h2><div className="format-options"><button onClick={() => { setFormat("blocks"); setStep("review"); }}><strong>Blocos</strong><span>Todos os minutos de uma trilha antes da próxima.</span></button><button onClick={() => { setFormat("circuit"); setStep("review"); }}><strong>Circuito</strong><span>As trilhas alternam minuto a minuto.</span></button></div></section>}
      {step === "review" && <section className="builder-step review-step"><p className="step-label">5 · REVISÃO</p><h2>{selected.length * SETS[duration]} minutos · {format === "blocks" ? "Blocos" : "Circuito"}</h2><div className="prescription-list">{prescriptions.map((prescription) => { const track = tracks.find((item) => item.id === prescription.track)!; const known = store.sessions.flatMap((session) => session.prescriptions.filter((item) => item.track === prescription.track).map((item) => item.chosenShortReps)); const message = contextualMessage(prescription.suggestedShortReps, prescription.chosenShortReps, known); return <article key={prescription.track} style={{ "--track": track.color } as CSSProperties}><div className="prescription-heading"><TrackIcon track={track.id} decorative /><div><small>{track.name}</small><h3>{track.exercise}</h3><p>{prescription.displayedReps} por série · {prescription.sets} minutos · volume estimado {prescription.estimatedVolume}</p></div></div><div className="dose-control"><button aria-label={`Diminuir repetições de ${track.name}`} onClick={() => setChosen((value) => ({ ...value, [prescription.track]: Math.max(1, (value[prescription.track] ?? prescription.suggestedShortReps) - 1) }))}>−</button><strong>{prescription.displayedReps}</strong><button aria-label={`Aumentar repetições de ${track.name}`} onClick={() => setChosen((value) => ({ ...value, [prescription.track]: (value[prescription.track] ?? prescription.suggestedShortReps) + 1 }))}>+</button></div><p className="context-message">{message}</p>{isLargeIncrease(prescription.suggestedShortReps, prescription.chosenShortReps) && <div className="choice-actions"><button>Manter minha escolha</button><button onClick={() => setChosen((value) => ({ ...value, [prescription.track]: prescription.suggestedShortReps }))}>Voltar à sugestão</button></div>}</article>; })}</div><WorkoutSequence prescriptions={prescriptions} mode={format} /><button className="primary-button" onClick={begin}>Iniciar treino</button></section>}
      {step === "running" && pending && <WorkoutTimer prescriptions={pending.prescriptions} format={pending.format} preferences={store.preferences} updatePreferences={store.updatePreferences} onFinish={() => setStep("pulse")} onInterrupt={interrupt} />}
      {step === "pulse" && <WorkoutPulse onConfirm={complete} />}
      {step === "done" && <section className="builder-step completion-step"><p className="step-label">REGISTRO INCORPORADO</p><h2>Treino concluído.</h2>{milestones.length ? <ul>{milestones.map((milestone) => <li key={milestone}>{milestone}</li>)}</ul> : <p>Mais uma referência para a sua jornada.</p>}<button className="primary-button" onClick={onClose}>Voltar à jornada</button></section>}
    </main>
  </div>;
}
