import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelCountdownSignal, enableSignalAudio, playCountdownSignal, playSignal } from "./signalAudio";

const frequency = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
const gainParam = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
const oscillator = { type: "sine", frequency, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
const gain = { gain: gainParam, connect: vi.fn() };
const audioContext = { currentTime: 2, state: "running", destination: {}, createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain), resume: vi.fn() };

const preferences = { sound: true, volume: .5, vibration: false };
const media = {
  addEventListener: vi.fn(),
  currentTime: 99,
  load: vi.fn(),
  pause: vi.fn(),
  play: vi.fn(() => Promise.resolve()),
  preload: "",
  volume: 1,
};
const AudioMock = vi.fn(() => media);

describe("signalAudio", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    oscillator.connect.mockReturnValue(gain);
    gain.connect.mockReturnValue(audioContext.destination);
    Object.defineProperty(window, "AudioContext", { configurable: true, value: vi.fn(() => audioContext) });
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() });
    vi.stubGlobal("Audio", AudioMock);
    cancelCountdownSignal();
  });

  it("toca prepare como um sinal curto, audível e de ganho menor", async () => {
    await enableSignalAudio();
    await playSignal("prepare", preferences);

    expect(AudioMock).toHaveBeenCalledWith("/audio/workout/mixkit-clock-countdown-bleeps-916.wav");
    expect(media.preload).toBe("auto");
    expect(media.load).toHaveBeenCalledOnce();
    expect(audioContext.createOscillator).toHaveBeenCalledOnce();
    expect(audioContext.createGain).toHaveBeenCalledOnce();
    expect(oscillator.type).toBe("sine");
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(950, 2.005);
    expect(frequency.linearRampToValueAtTime).not.toHaveBeenCalled();
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(.275, 2.005);
    expect(gainParam.exponentialRampToValueAtTime.mock.calls[0][1]).toBeCloseTo(2.095);
    expect(oscillator.stop.mock.calls[0][0]).toBeCloseTo(2.095);
  });

  it("toca command com timbre distinto, mais longo e mais forte", async () => {
    await enableSignalAudio();
    await playSignal("command", preferences);

    expect(audioContext.createOscillator).toHaveBeenCalledOnce();
    expect(audioContext.createGain).toHaveBeenCalledOnce();
    expect(oscillator.type).toBe("triangle");
    expect(frequency.setValueAtTime).toHaveBeenCalledWith(1450, 2.005);
    expect(frequency.linearRampToValueAtTime).not.toHaveBeenCalled();
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(.45, 2.005);
    expect(gainParam.exponentialRampToValueAtTime).toHaveBeenCalledWith(.0001, 2.225);
    expect(oscillator.stop).toHaveBeenCalledWith(2.225);
  });

  it("calcula o ganho usando o volume configurado", async () => {
    await enableSignalAudio();
    await playSignal("command", { ...preferences, volume: .25 });
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(.225, 2.005);
  });

  it("limita volumes altos a um ganho seguro", async () => {
    await enableSignalAudio();
    await playSignal("command", { ...preferences, volume: 10 });
    expect(gainParam.setValueAtTime).toHaveBeenCalledWith(1, 2.005);
    await playSignal("prepare", { ...preferences, volume: 10 });
    expect(gainParam.setValueAtTime).toHaveBeenLastCalledWith(1, 2.005);
  });

  it("nunca ultrapassa o ganho 1 e progride com o volume", async () => {
    await enableSignalAudio();
    await playSignal("command", { ...preferences, volume: .2 });
    const low = gainParam.setValueAtTime.mock.calls.at(-1)?.[0];
    await playSignal("command", { ...preferences, volume: .8 });
    const high = gainParam.setValueAtTime.mock.calls.at(-1)?.[0];
    await playSignal("command", { ...preferences, volume: 100 });
    const limited = gainParam.setValueAtTime.mock.calls.at(-1)?.[0];
    expect(low).toBeCloseTo(.18);
    expect(high).toBeCloseTo(.72);
    expect(high).toBeGreaterThan(low);
    expect(limited).toBe(1);
  });

  it("não cria nós de áudio quando o som está desligado", async () => {
    await enableSignalAudio();
    audioContext.createOscillator.mockClear();
    audioContext.createGain.mockClear();
    await playSignal("command", { sound: false, volume: .5, vibration: false });
    expect(audioContext.createOscillator).not.toHaveBeenCalled();
    expect(audioContext.createGain).not.toHaveBeenCalled();
  });

  it("reutiliza o arquivo de contagem após a habilitação", async () => {
    await enableSignalAudio();
    await playCountdownSignal(preferences);
    await playCountdownSignal(preferences);

    expect(media.preload).toBe("auto");
    expect(media.volume).toBe(.5);
    expect(media.currentTime).toBe(0);
    expect(media.play).toHaveBeenCalledOnce();
  });

  it("respeita som, volume e deslocamento e permite tocar novamente após cancelar", async () => {
    await enableSignalAudio();
    await playCountdownSignal({ ...preferences, sound: false }, 2);
    expect(media.play).not.toHaveBeenCalled();

    await playCountdownSignal({ ...preferences, volume: 4 }, 2);
    expect(media.volume).toBe(1);
    expect(media.currentTime).toBe(2);
    expect(media.play).toHaveBeenCalledOnce();

    cancelCountdownSignal();
    expect(media.pause).toHaveBeenCalled();
    expect(media.currentTime).toBe(0);
    await playCountdownSignal(preferences);
    expect(media.play).toHaveBeenCalledTimes(2);
  });
});
