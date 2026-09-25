"use client";
import { useEffect, useRef, useState } from "react";
import { enableEmomAudio, loadEmomPreferences, playEmomSignal, saveEmomPreferences, type EmomPreferences } from "./emomAudio";

const TOTAL_SECONDS = 300;
export function EmomTimer({ exercise, reps, onFinish }: { exercise: string; reps: number; onFinish: () => void }) {
  const [elapsed, setElapsed] = useState(0), [running, setRunning] = useState(false);
  const [preferences, setPreferences] = useState<EmomPreferences>(loadEmomPreferences);
  const startedAt = useRef(0), accumulated = useRef(0), emitted = useRef(new Set<number>()), finished = useRef(false);

  useEffect(() => {
    if (!running) return;
    const update = () => {
      const seconds = Math.min(TOTAL_SECONDS, (accumulated.current + Date.now() - startedAt.current) / 1000);
      const whole = Math.floor(seconds);
      for (let second = 55; second <= whole; second++) {
        if (second > TOTAL_SECONDS || emitted.current.has(second)) continue;
        const withinMinute = second % 60;
        if (withinMinute >= 55 && withinMinute <= 59) { emitted.current.add(second); void playEmomSignal("warning", preferences); }
        else if (withinMinute === 0 && second < TOTAL_SECONDS) { emitted.current.add(second); void playEmomSignal("minute", preferences); }
      }
      setElapsed(seconds);
      if (seconds >= TOTAL_SECONDS && !finished.current) {
        finished.current = true; setRunning(false); void playEmomSignal("finish", preferences); onFinish();
      }
    };
    update();
    const interval = window.setInterval(update, 100);
    const visibility = () => update();
    document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", visibility); };
  }, [running, preferences, onFinish]);

  const start = () => { void enableEmomAudio(); startedAt.current = Date.now(); setRunning(true); };
  const pause = () => { accumulated.current += Date.now() - startedAt.current; setRunning(false); };
  const end = () => { setRunning(false); onFinish(); };
  const changePreferences = (next: EmomPreferences) => { setPreferences(next); saveEmomPreferences(next); };
  const minute = Math.min(5, Math.floor(elapsed / 60) + 1), remaining = Math.max(0, 60 - Math.floor(elapsed % 60));
  const countdown = remaining <= 5 && running;
  return <section className={`emom-timer ${countdown ? "is-countdown" : ""}`} aria-label="Temporizador EMOM">
    <p className="step-label">EMOM · 5 MINUTOS</p><h2>Minuto {minute} de 5</h2>
    <div className="timer-clock" role="timer" aria-live="off"><strong>{String(remaining).padStart(2,"0")}</strong><span>segundos neste minuto</span></div>
    <progress value={elapsed} max={TOTAL_SECONDS} aria-label="Progresso total" /><p>{Math.floor(elapsed)} de 300 segundos</p>
    <div className="timer-prescription"><strong>{exercise}</strong><span>{reps} repetições</span><small>{countdown ? `Prepare-se: próximo minuto em ${remaining}` : "Concluiu as repetições? Descanse até o próximo minuto."}</small></div>
    <div className="timer-controls">{!running && elapsed === 0 && <button className="primary-button" onClick={start}>Iniciar</button>}{running && <button className="primary-button" onClick={pause}>Pausar</button>}{!running && elapsed > 0 && elapsed < TOTAL_SECONDS && <button className="primary-button" onClick={start}>Continuar</button>}<button className="secondary-button" onClick={end}>Encerrar</button></div>
    <fieldset className="timer-preferences"><legend>Sinais</legend><label><input type="checkbox" checked={preferences.sound} onChange={e=>changePreferences({...preferences,sound:e.target.checked})}/> Som</label><label>Volume <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={preferences.volume} onChange={e=>changePreferences({...preferences,volume:Number(e.target.value)})}/></label><label><input type="checkbox" checked={preferences.vibration} onChange={e=>changePreferences({...preferences,vibration:e.target.checked})}/> Vibração</label><button onClick={async()=>{await enableEmomAudio();void playEmomSignal("minute",preferences)}}>Ouvir prévia</button></fieldset>
  </section>;
}
