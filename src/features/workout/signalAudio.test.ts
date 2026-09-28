import { beforeEach, describe, expect, it, vi } from "vitest";
import { enableSignalAudio, playSignal } from "./signalAudio";

const frequency = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
const gainParam = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
const oscillator = { type: "sine", frequency, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
const gain = { gain: gainParam, connect: vi.fn() };
const audioContext = { currentTime: 2, state: "running", destination: {}, createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain), resume: vi.fn() };

const preferences = { sound: true, volume: .5, vibration: false };

describe("signalAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    oscillator.connect.mockReturnValue(gain);
    gain.connect.mockReturnValue(audioContext.destination);
    Object.defineProperty(window, "AudioContext", { configurable: true, value: vi.fn(() => audioContext) });
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() });
  });

  it("toca prepare como um pip curto de 900 Hz e ganho menor", async () => {
    await enableSignalAudio();
    await playSignal("prepare", preferences);

    expect(audioContext.createOscillator).toHaveBeenCalledOnce();
    expect(audioContext.createGain).toHaveBeenCalledOnce();
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(900, 2.005);
    expect(frequency.linearRampToValueAtTime).not.toHaveBeenCalled();
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(.06, 2.005);
    expect(gainParam.exponentialRampToValueAtTime.mock.calls[0][1]).toBeCloseTo(2.055);
    expect(oscillator.stop.mock.calls[0][0]).toBeCloseTo(2.055);
  });

  it("toca command como um único bip de 1400 Hz, mais longo e mais forte", async () => {
    await enableSignalAudio();
    await playSignal("command", preferences);

    expect(audioContext.createOscillator).toHaveBeenCalledOnce();
    expect(audioContext.createGain).toHaveBeenCalledOnce();
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(1400, 2.005);
    expect(frequency.linearRampToValueAtTime).not.toHaveBeenCalled();
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(.12, 2.005);
    expect(gainParam.exponentialRampToValueAtTime).toHaveBeenCalledWith(.0001, 2.185);
    expect(oscillator.stop).toHaveBeenCalledWith(2.185);
  });

  it("calcula o ganho usando o volume configurado", async () => {
    await enableSignalAudio();
    await playSignal("command", { ...preferences, volume: .25 });
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(.06, 2.005);
  });

  it("não cria nós de áudio quando o som está desligado", async () => {
    await enableSignalAudio();
    audioContext.createOscillator.mockClear();
    audioContext.createGain.mockClear();
    await playSignal("command", { sound: false, volume: .5, vibration: false });
    expect(audioContext.createOscillator).not.toHaveBeenCalled();
    expect(audioContext.createGain).not.toHaveBeenCalled();
  });
});
