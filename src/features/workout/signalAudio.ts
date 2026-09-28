export type SignalKind = "prepare" | "command";
export type SignalPreferences = { sound: boolean; volume: number; vibration: boolean };
const countdownUrl = "/audio/workout/mixkit-clock-countdown-bleeps-916.wav";
let context: AudioContext | null = null;
let countdown: HTMLAudioElement | null = null;
let countdownPlaying = false;
let enabled = false;

function countdownAudio() {
  if (!countdown) {
    countdown = new Audio(countdownUrl);
    countdown.preload = "auto";
    countdown.addEventListener("ended", () => { countdownPlaying = false; });
    countdown.load();
  }
  return countdown;
}

async function audioContext() {
  const AudioContextConstructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  context ??= new AudioContextConstructor();
  if (context.state === "suspended") await context.resume();
  return context;
}
export async function enableSignalAudio() {
  enabled = true;
  countdownAudio();
  return audioContext();
}

/** Starts the reusable recorded five-second countdown, optionally already in progress. */
export async function playCountdownSignal(preferences: SignalPreferences, offsetSeconds = 0) {
  if (!preferences.sound || !enabled || countdownPlaying) return;
  const audio = countdownAudio();
  audio.volume = Math.max(0, Math.min(1, preferences.volume));
  audio.currentTime = Math.max(0, offsetSeconds);
  countdownPlaying = true;
  await audio.play().catch(() => { countdownPlaying = false; });
}

/** Stops a countdown so pause, restart and finish cannot leave stale audio playing. */
export function cancelCountdownSignal() {
  if (!countdown) return;
  countdown.pause();
  countdown.currentTime = 0;
  countdownPlaying = false;
}

export async function playSignal(kind: SignalKind, preferences: SignalPreferences) {
  if (preferences.vibration && "vibrate" in navigator) navigator.vibrate(kind === "prepare" ? 18 : 45);
  if (!preferences.sound || !enabled) return;
  const audio = await audioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  const at = audio.currentTime + .005;
  const duration = kind === "prepare" ? .09 : .22;
  const peak = Math.max(.0001, Math.min(1, Math.max(0, preferences.volume) * (kind === "prepare" ? .55 : .9)));
  oscillator.type = kind === "prepare" ? "sine" : "triangle";
  oscillator.frequency.setValueAtTime(kind === "prepare" ? 950 : 1450, at);
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + duration);
}
