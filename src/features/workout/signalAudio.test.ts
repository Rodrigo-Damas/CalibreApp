import { beforeEach, describe, expect, it, vi } from "vitest";
import { enableSignalAudio, playSignal } from "./signalAudio";

const frequency = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
const gainParam = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
const oscillator = { type: "sine", frequency, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
const gain = { gain: gainParam, connect: vi.fn() };
const audioContext = { currentTime: 2, state: "running", destination: {}, createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain), resume: vi.fn() };

describe("signalAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    oscillator.connect.mockReturnValue(gain);
    gain.connect.mockReturnValue(audioContext.destination);
    Object.defineProperty(window, "AudioContext", { configurable: true, value: vi.fn(() => audioContext) });
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() });
  });

  it("produz duas varreduras contrastantes em uma sirene curta usando o volume configurado", async () => {
    await enableSignalAudio();
    await playSignal("start", { sound: true, volume: .5, vibration: false });
    expect(audioContext.createOscillator).toHaveBeenCalledOnce();
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(620, 2.005);
    expect(frequency.linearRampToValueAtTime.mock.calls.map(([value]) => value)).toEqual([980, 620, 980, 620]);
    expect(gainParam.setValueAtTime).toHaveBeenNthCalledWith(1, .12, 2.005);
    expect(oscillator.stop).toHaveBeenCalledWith(2.425);
    expect(navigator.vibrate).not.toHaveBeenCalled();
  });

  it("não cria áudio quando o som está desligado", async () => {
    await enableSignalAudio();
    audioContext.createOscillator.mockClear();
    await playSignal("start", { sound: false, volume: .5, vibration: false });
    expect(audioContext.createOscillator).not.toHaveBeenCalled();
  });
});
