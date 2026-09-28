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
  const at = audio.currentTime + .005;
  const duration = kind === "prepare" ? .18 : .38;
  const volume = Math.min(1, Math.max(0, preferences.volume));
  const layers = kind === "prepare"
    ? [{ frequency: 950, weight: .46, type: "sine" as OscillatorType }, { frequency: 1250, weight: .2, type: "sine" as OscillatorType }]
    : [{ frequency: 1450, weight: .58, type: "triangle" as OscillatorType }, { frequency: 980, weight: .3, type: "sine" as OscillatorType }];

  for (const layer of layers) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const peak = Math.max(.0001, volume * layer.weight);
    oscillator.type = layer.type;
    oscillator.frequency.setValueAtTime(layer.frequency, at);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.linearRampToValueAtTime(peak, at + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }
}
