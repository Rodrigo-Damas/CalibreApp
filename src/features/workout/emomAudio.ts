export type EmomSound = "warning" | "minute" | "finish";
export type EmomPreferences = { sound: boolean; volume: number; vibration: boolean };

export const defaultEmomPreferences: EmomPreferences = { sound: true, volume: 0.45, vibration: true };
const storageKey = "calibre-emom-preferences";
let context: AudioContext | null = null;

export function loadEmomPreferences(): EmomPreferences {
  if (typeof window === "undefined") return defaultEmomPreferences;
  try { return { ...defaultEmomPreferences, ...JSON.parse(localStorage.getItem(storageKey) ?? "{}") }; }
  catch { return defaultEmomPreferences; }
}
export function saveEmomPreferences(value: EmomPreferences) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

async function audioContext() {
  const Constructor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Constructor) return null;
  context ??= new Constructor();
  if (context.state === "suspended") await context.resume();
  return context;
}

/** Must be called from a click/tap handler to comply with browser autoplay rules. */
export async function enableEmomAudio() { return audioContext(); }

export async function playEmomSignal(kind: EmomSound, preferences: EmomPreferences) {
  if (preferences.vibration && "vibrate" in navigator) navigator.vibrate(kind === "warning" ? 18 : kind === "minute" ? 45 : [60, 40, 90]);
  if (!preferences.sound) return;
  const audio = await audioContext();
  if (!audio) return;
  const start = audio.currentTime + 0.005;
  const frequencies = kind === "warning" ? [880] : kind === "minute" ? [392, 523] : [523, 659, 784];
  for (const [index, frequency] of frequencies.entries()) {
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    const at = start + index * 0.025, duration = kind === "warning" ? 0.09 : 0.22;
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, preferences.volume * 0.16), at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(at); oscillator.stop(at + duration + 0.01);
  }
}
