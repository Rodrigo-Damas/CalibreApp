import { beforeEach, describe, expect, it, vi } from "vitest";
import { enableSignalAudio, playSignal } from "./signalAudio";

const frequency = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
const gainParam = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
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

  it("toca prepare em duas camadas com ataque e duração ampliados", async () => {
    await enableSignalAudio();
    await playSignal("prepare", preferences);

    expect(audioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(audioContext.createGain).toHaveBeenCalledTimes(2);
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(950, 2.005);
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(1250, 2.005);
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(.0001, 2.005);
    expect(gainParam.linearRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(.23);
    expect(gainParam.linearRampToValueAtTime.mock.calls[0][1]).toBeCloseTo(2.023);
    expect(gainParam.linearRampToValueAtTime.mock.calls[1][0]).toBeCloseTo(.1);
    expect(gainParam.exponentialRampToValueAtTime).toHaveBeenCalledWith(.0001, 2.185);
    expect(oscillator.stop).toHaveBeenCalledWith(2.185);
  });

  it("toca command com timbre distinto, mais longo e mais forte", async () => {
    await enableSignalAudio();
    await playSignal("command", preferences);

    expect(audioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(audioContext.createGain).toHaveBeenCalledTimes(2);
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(1450, 2.005);
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(980, 2.005);
    expect(gainParam.linearRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(.29);
    expect(gainParam.linearRampToValueAtTime.mock.calls[0][1]).toBeCloseTo(2.023);
    expect(gainParam.linearRampToValueAtTime.mock.calls[1][0]).toBeCloseTo(.15);
    expect(gainParam.exponentialRampToValueAtTime).toHaveBeenCalledWith(.0001, 2.385);
    expect(oscillator.stop).toHaveBeenCalledWith(2.385);
  });

  it("calcula o ganho usando o volume configurado", async () => {
    await enableSignalAudio();
    await playSignal("command", { ...preferences, volume: .25 });
    expect(gainParam.linearRampToValueAtTime.mock.calls[0][0]).toBeCloseTo(.145);
    expect(gainParam.linearRampToValueAtTime.mock.calls[1][0]).toBeCloseTo(.075);
  });

  it("limita volumes altos a um ganho seguro", async () => {
    await enableSignalAudio();
    await playSignal("command", { ...preferences, volume: 10 });
    expect(gainParam.linearRampToValueAtTime.mock.calls.slice(-2).reduce((sum, [value]) => sum + value, 0)).toBeLessThanOrEqual(1);
    await playSignal("prepare", { ...preferences, volume: 10 });
    expect(gainParam.linearRampToValueAtTime.mock.calls.slice(-2).reduce((sum, [value]) => sum + value, 0)).toBeLessThanOrEqual(1);
  });

  it("nunca ultrapassa o ganho 1 e progride com o volume", async () => {
    await enableSignalAudio();
    await playSignal("command", { ...preferences, volume: .2 });
    const low = gainParam.linearRampToValueAtTime.mock.calls.at(-2)?.[0];
    await playSignal("command", { ...preferences, volume: .8 });
    const high = gainParam.linearRampToValueAtTime.mock.calls.at(-2)?.[0];
    await playSignal("command", { ...preferences, volume: 100 });
    const limited = gainParam.linearRampToValueAtTime.mock.calls.at(-2)?.[0];
    expect(low).toBeCloseTo(.116);
    expect(high).toBeCloseTo(.464);
    expect(high).toBeGreaterThan(low);
    expect(limited).toBe(.58);
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
