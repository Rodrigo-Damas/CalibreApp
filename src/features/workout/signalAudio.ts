export type SignalKind = "prepare" | "start" | "finish";
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
  if (preferences.vibration && "vibrate" in navigator) navigator.vibrate(kind === "prepare" ? 18 : kind === "start" ? [45, 25, 45] : [80, 45, 120]);
  if (!preferences.sound || !enabled) return;
  const audio = await audioContext();
  if (!audio) return;
  const frequencies = kind === "prepare" ? [1046] : kind === "start" ? [440, 880] : [523, 659, 784];
  const duration = kind === "prepare" ? .1 : kind === "start" ? .24 : .34;
  frequencies.forEach((frequency, index) => {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const at = audio.currentTime + .005 + index * (kind === "start" ? .09 : .06);
    oscillator.type = kind === "prepare" ? "square" : kind === "start" ? "sine" : "triangle";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001, preferences.volume * .16), at + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + duration + .02);
  });
}
