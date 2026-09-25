"use client";

import { ArrowLeft, Pause, Play, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { type SessionPrescription, type WorkoutFormat } from "@/mocks/data";
import { sequence } from "./recommendationEngine";
import { enableSignalAudio, playSignal, type SignalPreferences } from "./signalAudio";

type Props = {
  prescriptions?: SessionPrescription[];
  format?: WorkoutFormat;
  preferences?: SignalPreferences & { reducedMotion?: boolean };
  updatePreferences?: (preferences: Partial<SignalPreferences>) => void;
  exercise?: string;
  reps?: number;
  onFinish: (elapsed?: number) => void;
  onInterrupt?: (elapsed: number) => void;
};

const defaultPreferences = { sound: true, volume: .45, vibration: true };

export function WorkoutTimer({ prescriptions, format = "blocks", preferences = defaultPreferences, updatePreferences, reps, onFinish, onInterrupt }: Props) {
  const doses: SessionPrescription[] = prescriptions?.length ? prescriptions : [{ track: "push", exerciseKey: "floor-push-up", suggestedShortReps: reps || 1, chosenShortReps: reps || 1, displayedReps: reps || 1, sets: 5, estimatedVolume: (reps || 1) * 5 }];
  const order = sequence(doses, doses[0].sets, format);
  const total = order.length * 60;
  const [elapsed, setElapsed] = useState(-10);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [settings, setSettings] = useState(preferences);
  const started = useRef(0);
  const offset = useRef(0);
  const currentSecond = useRef(-10);
  const emitted = useRef(new Set<number>());
  const done = useRef(false);
  const preferencesRef = useRef(preferences);
  const finishRef = useRef(onFinish);

  useEffect(() => { preferencesRef.current = settings; }, [settings]);
  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);
  useEffect(() => {
    if (!running || paused) return;
    const tick = () => {
      const now = (offset.current + Date.now() - started.current) / 1000 - 10;
      const whole = Math.floor(now);
      for (let second = currentSecond.current + 1; second <= Math.min(whole, total - 1); second++) {
        if (emitted.current.has(second)) continue;
        const within = ((second % 60) + 60) % 60;
        const inFinalRound = second >= total - 60;
        const attention = (second >= -5 && second <= -2) || (!inFinalRound && second >= 0 && within >= 55 && within <= 58);
        const command = second === -1 || (!inFinalRound && second > 0 && within === 59);
        if (attention || command) {
          emitted.current.add(second);
          void playSignal(command ? "start" : "prepare", preferencesRef.current);
        }
      }
      currentSecond.current = Math.max(currentSecond.current, whole);
      setElapsed(Math.min(total, now));
      if (now >= total && !done.current) {
        done.current = true;
        setRunning(false);
        void playSignal("finish", preferencesRef.current);
        finishRef.current(total);
      }
    };
    tick();
    const id = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [running, paused, total]);

  function changePreferences(change: Partial<SignalPreferences>) {
    setSettings((current) => ({ ...current, ...change }));
    updatePreferences?.(change);
  }
  async function start() { await enableSignalAudio(); started.current = Date.now(); setRunning(true); setPaused(false); }
  function pause() { offset.current += Date.now() - started.current; setPaused(true); setRunning(false); }
  async function resume() { await enableSignalAudio(); started.current = Date.now(); setRunning(true); setPaused(false); }

  const active = Math.min(order.length - 1, Math.max(0, Math.floor(Math.max(0, elapsed) / 60)));
  const within = Math.max(0, Math.floor(elapsed) % 60);
  const remaining = elapsed < 0 ? Math.ceil(-elapsed) : 60 - within;
  const attention = (elapsed < 0 && remaining <= 5 && remaining >= 2) || (active < order.length - 1 && elapsed >= 0 && remaining <= 5 && remaining >= 2);
  const command = remaining === 1 && (elapsed < 0 || active < order.length - 1);
  const timerState = paused ? "paused" : command ? "command" : attention ? "attention" : elapsed < 0 ? "preparing" : "running";
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return <section className="workout-timer" aria-label="Cronômetro" data-state={timerState} data-reduced-motion={settings.reducedMotion || undefined}>
    <header className="timer-header">
      <button type="button" aria-label="Voltar" onClick={() => setConfirm(true)}><ArrowLeft aria-hidden="true" /></button>
      <strong>ROUND {active + 1} DE {order.length}</strong>
    </header>

    <div className="scoreboard">
      <div className="round-display" aria-label={`Round ${active + 1}`}><span aria-hidden="true">{active + 1}</span></div>
      <div className="timer-clock" role="timer" aria-label={`${remaining} ${remaining === 1 ? "segundo" : "segundos"}`} aria-live={command ? "assertive" : "off"}>
        <strong aria-hidden="true">{clock}</strong>
      </div>
    </div>

    <div className="timer-controls" aria-label="Controles do cronômetro">
      {!running && elapsed === -10 && <button className="timer-start" type="button" onClick={start}><Play aria-hidden="true" /> Iniciar</button>}
      {running && <button type="button" onClick={pause}><Pause aria-hidden="true" /><span>Pausar</span></button>}
      {paused && <button type="button" onClick={resume}><Play aria-hidden="true" /><span>Continuar</span></button>}
      <button type="button" aria-pressed={settings.sound} onClick={() => changePreferences({ sound: !settings.sound })}>{settings.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}<span>{settings.sound ? "Áudio ligado" : "Áudio desligado"}</span></button>
      <button type="button" onClick={() => setConfirm(true)}><Square aria-hidden="true" /><span>Encerrar</span></button>
    </div>

    {confirm && <div className="timer-confirm" role="alertdialog" aria-modal="true" aria-label="Confirmar interrupção"><p>Ao encerrar, o treino ficará marcado como interrompido e nenhum volume será estimado.</p><div><button onClick={() => setConfirm(false)}>Continuar treino</button><button onClick={() => onInterrupt?.(Math.max(0, Math.floor(elapsed)))}>Marcar como interrompido</button></div></div>}
  </section>;
}

export const EmomTimer = WorkoutTimer;
