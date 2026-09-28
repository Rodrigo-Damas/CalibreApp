export type SignalKind = "prepare" | "command";
export type SignalPreferences = { sound: boolean; volume: number; vibration: boolean };
let context: AudioContext | null = null;
let enabled = false;
async function audioContext() {
  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  context ??= new AudioContextConstructor();
  if (context.state === "suspended") await context.resume();
  return context;
}
export async function enableSignalAudio() { enabled = true; return audioContext(); }
export async function playSignal(kind: SignalKind, preferences: SignalPreferences) {
  if (preferences.vibration && "vibrate" in navigator) navigator.vibrate(kind === "prepare" ? 18 : 45);
  if (!preferences.sound || !enabled) return;
  const audio = await audioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const at = audio.currentTime + .005;
  const duration = kind === "prepare" ? .05 : .18;
  const peak = Math.max(.0001, Math.min(1, preferences.volume) * (kind === "prepare" ? .16 : .32));
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(kind === "prepare" ? 900 : 1400, at);
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + duration);
}
