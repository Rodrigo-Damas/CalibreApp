"use client";

import { useEffect, useRef, useState } from "react";
import { tracks, type SessionPrescription, type WorkoutFormat } from "@/mocks/data";
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

export function WorkoutTimer({ prescriptions, format = "blocks", preferences = defaultPreferences, updatePreferences, exercise, reps, onFinish, onInterrupt }: Props) {
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
  const vibrationSupported = typeof navigator !== "undefined" && "vibrate" in navigator;
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
        const prepare = (second >= -5 && second <= -1) || (second > 0 && within >= 55);
        const turn = second === 0 || (second > 0 && within === 0);
        if (prepare || turn) {
          emitted.current.add(second);
          void playSignal(turn ? "start" : "prepare", preferencesRef.current);
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

  function changePreferences(change: Partial<SignalPreferences>) { setSettings((current) => ({ ...current, ...change })); updatePreferences?.(change); }
  async function start() { await enableSignalAudio(); started.current = Date.now(); setRunning(true); setPaused(false); }
  function pause() { offset.current += Date.now() - started.current; setPaused(true); setRunning(false); }
  async function resume() { await enableSignalAudio(); started.current = Date.now(); setRunning(true); setPaused(false); }
  async function testSignal() { await enableSignalAudio(); await playSignal("start", settings); }

  const active = Math.min(order.length - 1, Math.max(0, Math.floor(Math.max(0, elapsed) / 60)));
  const dose = order[active];
  const track = tracks.find((item) => item.id === dose.track)!;
  const within = Math.max(0, Math.floor(elapsed) % 60);
  const remaining = elapsed < 0 ? Math.ceil(-elapsed) : 60 - within;
  const final = active === order.length - 1;
  const command = elapsed < 0 ? "Prepare-se." : within >= 55 ? "Prepare-se." : within < 15 ? (final ? "Última. Feche no seu ritmo." : `Comece. ${dose.displayedReps} repetições.`) : "Terminou? Respire. Aguarde o próximo sinal.";

  return <section className="workout-timer" aria-label="Execução do treino" data-reduced-motion={settings.reducedMotion || undefined}>
    <p className="step-label">EXECUÇÃO AUTOMÁTICA</p><h2>{elapsed < 0 ? `Começa em ${remaining}` : `Minuto ${active + 1} de ${order.length}`}</h2>
    {!running && elapsed === -10 && <fieldset className="timer-sound-controls"><legend>Sinais do treino</legend><label><span>Sinais sonoros</span><input type="checkbox" checked={settings.sound} onChange={(event) => changePreferences({ sound: event.target.checked })} /></label><label className="volume-control"><span>Volume</span><input aria-label="Volume" type="range" min="0" max="1" step=".05" value={settings.volume} disabled={!settings.sound} onChange={(event) => changePreferences({ volume: Number(event.target.value) })} /></label>{vibrationSupported && <label><span>Vibração</span><input type="checkbox" checked={settings.vibration} onChange={(event) => changePreferences({ vibration: event.target.checked })} /></label>}<button type="button" onClick={testSignal} disabled={!settings.sound && !settings.vibration}>Testar sinal</button></fieldset>}
    <div className="timer-clock" role="timer"><strong>{String(remaining).padStart(2, "0")}</strong><span>segundos</span></div>
    <div className="timer-prescription"><small>{track.name}</small><strong>{exercise || track.exercise}</strong><span>{dose.displayedReps} repetições</span><p aria-live="polite">{command}</p></div>
    {!running && elapsed === -10 && <button className="primary-button" onClick={start}>Começar contagem</button>}{running && <button className="timer-pause" onClick={pause}>Pausar</button>}{paused && <button className="timer-pause" onClick={resume}>Continuar</button>}<button className="timer-exit" onClick={() => setConfirm(true)}>Encerrar treino</button>{confirm && <div className="inline-confirm" role="alertdialog" aria-label="Confirmar interrupção"><p>Ao encerrar, o treino ficará marcado como interrompido e nenhum volume será estimado.</p><button onClick={() => setConfirm(false)}>Continuar treino</button><button onClick={() => onInterrupt?.(Math.max(0, Math.floor(elapsed)))}>Marcar como interrompido</button></div>}
  </section>;
}
export const EmomTimer = WorkoutTimer;
