"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { X } from "lucide-react";
import { tracks, localDateString, type DurationChoice, type Perception, type TrackId, type WorkoutFormat, type WorkoutSession } from "@/mocks/data";
import { useMockStore } from "@/mocks/store";
import { compareCompletedPerformance, makePrescription, repetitionsReference, SETS } from "./recommendationEngine";
import { TrackSelector } from "./TrackSelector";
import { WorkoutTimer } from "./EmomTimer";
import { WorkoutPulse } from "./WorkoutPulse";

type Step = "planning" | "running" | "pulse" | "done";
type Milestone = { state: "increase" | "personal-record"; text: string };

export function WorkoutFlow({ onClose, initialTrack, initialTracks }: { onClose: () => void; initialTrack?: TrackId; initialTracks?: TrackId[] }) {
  const title = useRef<HTMLHeadingElement>(null);
  const startButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLElement>(null);
  const store = useMockStore();
  const startingTracks = initialTracks ?? (initialTrack ? [initialTrack] : []);
  const [step, setStep] = useState<Step>("planning");
  const [selected, setSelected] = useState<TrackId[]>(startingTracks);
  const [duration, setDuration] = useState<DurationChoice>("short");
  const [format, setFormat] = useState<WorkoutFormat>("blocks");
  const [chosen, setChosen] = useState<Partial<Record<TrackId, number>>>({});
  const [pending, setPending] = useState<WorkoutSession | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [confirming, setConfirming] = useState(false);
  const today = localDateString();
  const repeated = tracks.filter((track) => store.sessions.some((session) => session.date === today && session.prescriptions.some((item) => item.track === track.id))).map((track) => track.id);
  const references = useMemo(() => Object.fromEntries(tracks.map((track) => [track.id, repetitionsReference(track.id, track.initialShortRecommendation, store.sessions)])) as Record<TrackId, number>, [store.sessions]);
  const prescriptions = selected.map((id) => {
    const track = tracks.find((item) => item.id === id)!;
    return makePrescription(id, track.exerciseKey, chosen[id] ?? references[id], duration);
  });
  const plannedMinutes = prescriptions.length * SETS[duration];
  const sessionVolume = prescriptions.reduce((sum, item) => sum + item.totalVolume, 0);
  const formatLabel = format === "blocks" ? "Blocos" : "Circuito";

  useEffect(() => { title.current?.focus(); }, []);
  useEffect(() => {
    if (!confirming) return;
    confirmButton.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeConfirmation();
      if (event.key !== "Tab" || !confirmation.current) return;
      const focusable = [...confirmation.current.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [confirming]);

  function toggle(id: TrackId) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function changeReps(id: TrackId, delta: number) { setChosen((value) => ({ ...value, [id]: Math.max(1, (value[id] ?? references[id]) + delta) })); }
  function closeConfirmation() { setConfirming(false); window.setTimeout(() => startButton.current?.focus(), 0); }
  function begin() {
    const now = new Date();
    const id = `session-${now.getTime()}`;
    setPending({ id, combinedId: id, date: today, time: now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), duration, format, arrival: "normal", plannedMinutes: selected.length * SETS[duration], elapsedSeconds: 0, status: "completed", prescriptions });
    setConfirming(false);
    setStep("running");
  }
  function interrupt(seconds: number) {
    if (!pending) return;
    store.completeSession({ ...pending, status: "interrupted", elapsedSeconds: seconds, prescriptions: pending.prescriptions.map((item) => ({ ...item, totalVolume: 0 })) });
    onClose();
  }
  function complete(perception: Perception) {
    if (!pending) return;
    const finished = { ...pending, perception, elapsedSeconds: pending.plannedMinutes * 60 } as WorkoutSession;
    const wins = finished.prescriptions.flatMap<Milestone>((dose) => {
      const track = tracks.find((item) => item.id === dose.track)!;
      const result = compareCompletedPerformance(dose.track, dose, store.sessions);
      if (result.state === "personal-record") return [{ state: result.state, text: `Novo recorde pessoal em ${track.name}: ${track.exercise}: ${result.currentVolume} repetições.` }];
      if (result.state === "increase") return [{ state: result.state, text: `Volume maior que o último treino em ${track.name}: ${track.exercise}: ${result.currentVolume} repetições.` }];
      return [];
    });
    store.completeSession(finished);
    setPending(finished);
    setMilestones(wins);
    setStep("done");
  }

  return <div className={`workout-builder${step === "running" ? " timer-active" : ""}`} role="dialog" aria-modal="true" aria-label={step === "running" ? "Cronômetro" : "Montar treino"} data-reduced-motion={store.preferences.reducedMotion || undefined}>
    {step !== "running" && <header className="builder-header"><span aria-hidden="true" /><div className="builder-header__title"><h1 ref={title} tabIndex={-1}>Montar treino</h1></div><button onClick={onClose} aria-label="Fechar"><X aria-hidden="true" /></button></header>}
    <main>
      {step === "planning" && <section className="builder-step build-sheet"><section className="track-picker" aria-labelledby="tracks-title"><div><p className="step-label">Trilhas</p><h2 id="tracks-title">Escolha as trilhas</h2><p>A ordem de seleção define a ordem do treino.</p></div><TrackSelector selected={selected} onToggle={toggle} repeated={repeated} /></section>{selected.some((item) => repeated.includes(item)) && <aside className="recovery-note">Treino feito hoje. Você pode fazer outra sessão.</aside>}
        <header className="workout-overview"><p className="step-label">Seu treino</p><h2>{selected.length ? selected.map((id) => tracks.find((track) => track.id === id)!.name).join(" · ") : "Nenhuma trilha selecionada"}</h2><section className="build-summary" aria-label="Resumo do treino" aria-live="polite"><dl><div><dt>Duração total</dt><dd>{selected.length ? `${plannedMinutes} min` : "Não definido"}</dd></div><div><dt>Exercícios</dt><dd>{prescriptions.length}</dd></div><div><dt>Formato</dt><dd>{selected.length ? formatLabel : "Não definido"}</dd></div><div><dt>Volume total</dt><dd>{selected.length ? `${sessionVolume} repetições` : "Não definido"}</dd></div></dl>{prescriptions.length ? <ul>{prescriptions.map((prescription) => { const track = tracks.find((item) => item.id === prescription.track)!; return <li key={prescription.track}><strong>{track.exercise}</strong><span>{prescription.sets} séries · {prescription.repsPerSet} por série · {prescription.totalVolume} repetições</span></li>; })}</ul> : <p className="build-empty">Selecione uma trilha acima para definir duração, formato e repetições.</p>}</section></header>
        {selected.length > 0 && <>
        <section className="build-section" aria-labelledby="duration-title"><h3 id="duration-title">Defina a duração</h3><div className="duration-segmented" role="group" aria-label="Duração do treino">{(["short", "long"] as DurationChoice[]).map((choice) => <button key={choice} aria-pressed={duration === choice} onClick={() => setDuration(choice)}><strong>{choice === "short" ? "Curto" : "Longo"}</strong><small>{SETS[choice]} séries por trilha</small></button>)}</div></section>
        {selected.length > 1 && <section className="build-section"><h3>Escolha o formato</h3><div className="format-segmented" role="group" aria-label="Formato do treino"><button aria-pressed={format === "blocks"} onClick={() => setFormat("blocks")}><strong>Blocos</strong><span>Uma trilha por vez</span></button><button aria-pressed={format === "circuit"} onClick={() => setFormat("circuit")}><strong>Circuito</strong><span>Alternar exercícios</span></button></div></section>}
        <section className="build-section prescription-section"><h3>Repetições por série</h3><p>Mantenha o mesmo número de repetições em todas as séries.</p><div className="prescription-list">{prescriptions.map((prescription, index) => { const track = tracks.find((item) => item.id === prescription.track)!; return <article key={prescription.track} style={{ "--track": track.color } as CSSProperties}><div className="prescription-heading"><small>{index + 1}. {track.name}</small><h4>{track.exercise}</h4><p><strong>{prescription.sets} séries</strong><span>{prescription.repsPerSet} repetições por série em todas elas</span></p></div><div className="dose-control"><button aria-label={`Diminuir repetições de ${track.name}`} onClick={() => changeReps(track.id, -1)}>−</button><strong aria-label={`${prescription.repsPerSet} repetições por série`}>{prescription.repsPerSet}<small> por série</small></strong><button aria-label={`Aumentar repetições de ${track.name}`} onClick={() => changeReps(track.id, 1)}>+</button></div></article>; })}</div></section>
        </>}
        <div className="builder-sticky-action"><button ref={startButton} className="primary-button" disabled={!selected.length} onClick={() => setConfirming(true)}>Revisar e começar</button></div>
      </section>}
      {step === "running" && pending && <WorkoutTimer prescriptions={pending.prescriptions} format={pending.format} preferences={store.preferences} updatePreferences={store.updatePreferences} onFinish={() => setStep("pulse")} onInterrupt={interrupt} />}
      {step === "pulse" && <WorkoutPulse onConfirm={complete} />}
      {step === "done" && pending && <section className="builder-step completion-step"><h2>Treino concluído</h2><dl><div><dt>Duração</dt><dd>{pending.plannedMinutes} min</dd></div><div><dt>Trilhas</dt><dd>{pending.prescriptions.map((item) => tracks.find((track) => track.id === item.track)!.name).join(", ")}</dd></div><div><dt>Volume total executado</dt><dd>{pending.prescriptions.reduce((sum, item) => sum + item.totalVolume, 0)} repetições</dd></div></dl>{milestones.length > 0 && <ul className="milestone-list">{milestones.map((milestone) => <li className={`is-${milestone.state}`} key={milestone.text}><strong>{milestone.state === "personal-record" ? "Recorde pessoal" : "Aumento"}</strong>{milestone.text}</li>)}</ul>}<button className="primary-button" onClick={onClose}>Voltar para a agenda</button></section>}
    </main>
    {confirming && <div className="preworkout-backdrop"><section ref={confirmation} className="preworkout-confirm" role="dialog" aria-modal="true" aria-labelledby="ready-title"><h2 id="ready-title">Tudo pronto?</h2><dl><div><dt>Duração</dt><dd>{plannedMinutes} minutos</dd></div><div><dt>Exercícios</dt><dd>{prescriptions.length}</dd></div><div><dt>Formato</dt><dd>{formatLabel}</dd></div></dl><div><button onClick={closeConfirmation}>Voltar e ajustar</button><button ref={confirmButton} className="primary-button" onClick={begin}>Iniciar cronômetro</button></div></section></div>}
  </div>;
}
