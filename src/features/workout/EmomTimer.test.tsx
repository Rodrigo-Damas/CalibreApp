import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionPrescription } from "@/mocks/data";
import { WorkoutTimer } from "./EmomTimer";
import { cancelCountdownSignal, enableSignalAudio, playCountdownSignal, playSignal } from "./signalAudio";

vi.mock("./signalAudio", async (importOriginal) => ({ ...await importOriginal<typeof import("./signalAudio")>(), cancelCountdownSignal: vi.fn(), enableSignalAudio: vi.fn(), playCountdownSignal: vi.fn(), playSignal: vi.fn() }));
const signal = vi.mocked(playSignal);
const countdown = vi.mocked(playCountdownSignal);
const cancelCountdown = vi.mocked(cancelCountdownSignal);
const enable = vi.mocked(enableSignalAudio);
const advance = async (milliseconds: number) => act(async () => vi.advanceTimersByTime(milliseconds));
const start = async () => { fireEvent.click(screen.getByRole("button", { name: "Iniciar" })); await act(async () => {}); };
const prescription = (track: "push" | "pull"): SessionPrescription => ({ track, exerciseKey: track === "push" ? "floor-push-up" : "pull-up", repsPerSet: 5, sets: 5, totalVolume: 25 });

describe("WorkoutTimer", () => {
  beforeEach(() => { vi.useFakeTimers(); signal.mockClear(); countdown.mockClear(); cancelCountdown.mockClear(); enable.mockClear(); Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() }); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  it("mostra trilha, exercício, repetições, série e preparação", () => { render(<WorkoutTimer exercise="Flexão no solo" reps={12} onFinish={() => {}} />); expect(screen.getByText("Empurrar")).toBeVisible(); expect(screen.getByText("Flexão no solo")).toBeVisible(); expect(screen.getByText("12 repetições")).toBeVisible(); expect(screen.getByText("Série 1 de 5")).toBeVisible(); expect(screen.getByRole("timer", { name: "10 segundos" })).toHaveTextContent("00:10"); });
  it("mantém o fundo padrão na preparação e expõe Empurrar no primeiro minuto", async () => {
    render(<WorkoutTimer reps={5} onFinish={() => {}} />);
    const timer = screen.getByLabelText("Cronômetro");
    expect(timer).toHaveAttribute("data-track", "preparing");
    expect(timer).toHaveStyle({ "--track": "var(--track-push)" });
    await start();
    await advance(10_000);
    expect(timer).toHaveAttribute("data-track", "push");
    expect(screen.getByText("Empurrar")).toBeVisible();
  });
  it("alterna Empurrar e Puxar a cada minuto no Circuito", async () => {
    render(<WorkoutTimer prescriptions={[prescription("push"), prescription("pull")]} format="circuit" onFinish={() => {}} />);
    await start();
    await advance(10_000);
    expect(screen.getByLabelText("Cronômetro")).toHaveAttribute("data-track", "push");
    await advance(60_000);
    expect(screen.getByLabelText("Cronômetro")).toHaveAttribute("data-track", "pull");
    expect(screen.getByText("Puxar")).toBeVisible();
    await advance(60_000);
    expect(screen.getByLabelText("Cronômetro")).toHaveAttribute("data-track", "push");
  });
  it("troca a cor somente na transição de bloco no formato Blocos", async () => {
    render(<WorkoutTimer prescriptions={[prescription("push"), prescription("pull")]} format="blocks" onFinish={() => {}} />);
    await start();
    await advance(10_000);
    const timer = screen.getByLabelText("Cronômetro");
    expect(timer).toHaveAttribute("data-track", "push");
    await advance(299_900);
    expect(timer).toHaveAttribute("data-track", "push");
    await advance(100);
    expect(timer).toHaveAttribute("data-track", "pull");
  });
  it("expõe movimento reduzido no elemento que troca o fundo", () => {
    render(<WorkoutTimer reps={5} preferences={{ sound: true, volume: .5, vibration: true, reducedMotion: true }} onFinish={() => {}} />);
    expect(screen.getByLabelText("Cronômetro")).toHaveAttribute("data-reduced-motion", "true");
  });
  it("inicia uma única contagem gravada em 00:05 na preparação", async () => { render(<WorkoutTimer reps={12} onFinish={() => {}} />); await start(); expect(enable).toHaveBeenCalledOnce(); await advance(4_999); expect(countdown).not.toHaveBeenCalled(); await advance(1); expect(screen.getByRole("timer", { name: "5 segundos" })).toHaveTextContent("00:05"); expect(countdown).toHaveBeenCalledOnce(); expect(countdown).toHaveBeenCalledWith(expect.any(Object), 0); await advance(4_000); expect(countdown).toHaveBeenCalledOnce(); });
  it("inicia uma contagem em cada troca sem duplicar no tick da virada", async () => { render(<WorkoutTimer reps={5} onFinish={() => {}} />); await start(); await advance(69_900); expect(countdown).toHaveBeenCalledTimes(2); await advance(100); expect(screen.getByText("Série 2 de 5")).toBeVisible(); expect(screen.getByRole("timer", { name: "60 segundos" })).toHaveTextContent("01:00"); expect(countdown).toHaveBeenCalledTimes(2); });
  it("não duplica após pausa, retomada ou eventos de visibilidade", async () => { render(<WorkoutTimer reps={5} onFinish={() => {}} />); await start(); await advance(5_000); fireEvent.click(screen.getByRole("button", { name: "Pausar" })); expect(cancelCountdown).toHaveBeenCalledOnce(); await advance(60_000); document.dispatchEvent(new Event("visibilitychange")); expect(countdown).toHaveBeenCalledOnce(); fireEvent.click(screen.getByRole("button", { name: "Continuar" })); await act(async () => {}); await advance(60_000); expect(countdown).toHaveBeenCalledTimes(2); document.dispatchEvent(new Event("visibilitychange")); expect(countdown).toHaveBeenCalledTimes(2); });
  it("reinicia imediatamente pela preparação e descarta todo o progresso anterior", async () => {
    const finish = vi.fn();
    const prescription: SessionPrescription = { track: "push", exerciseKey: "floor-push-up", repsPerSet: 5, sets: 5, totalVolume: 25 };
    render(<WorkoutTimer prescriptions={[prescription]} onFinish={finish} />);
    await start();
    await advance(20_000);
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(screen.getByRole("button", { name: "Continuar" })).toBeVisible();

    const signalsBeforeRestart = countdown.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Reiniciar" }));
    await act(async () => {});
    expect(enable).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("timer", { name: "10 segundos" })).toHaveTextContent("00:10");
    expect(screen.getByText("0%")).toBeVisible();

    await advance(9_000);
    expect(countdown.mock.calls.slice(signalsBeforeRestart)).toHaveLength(1);
    const afterCountdown = countdown.mock.calls.length;
    document.dispatchEvent(new Event("visibilitychange"));
    expect(countdown).toHaveBeenCalledTimes(afterCountdown);

    await advance(300_900);
    expect(finish).not.toHaveBeenCalled();
    await advance(100);
    expect(finish).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledWith(300);
  });
  it("expõe e persiste o controle secundário de áudio", () => { const update = vi.fn(); const preferences = { sound: false, volume: .2, vibration: false }; render(<WorkoutTimer reps={5} preferences={preferences} updatePreferences={update} onFinish={() => {}} />); const audio = screen.getByRole("button", { name: "Áudio desligado" }); expect(audio).toHaveAttribute("aria-pressed", "false"); fireEvent.click(audio); expect(update).toHaveBeenCalledWith({ sound: true }); expect(screen.getByRole("button", { name: "Áudio ligado" })).toHaveAttribute("aria-pressed", "true"); });
  it("reproduz também a última contagem e nenhuma depois da conclusão", async () => { const finish = vi.fn(); render(<WorkoutTimer reps={5} onFinish={finish} />); await start(); await advance(305_000); expect(countdown).toHaveBeenCalledTimes(6); expect(countdown.mock.calls.at(-1)?.[1]).toBe(0); await advance(5_000); expect(cancelCountdown).toHaveBeenCalled(); const count = countdown.mock.calls.length; document.dispatchEvent(new Event("visibilitychange")); await advance(60_000); expect(countdown).toHaveBeenCalledTimes(count); expect(finish).toHaveBeenCalledWith(300); });
  it("retoma uma contagem atrasada no deslocamento correto e ignora uma já encerrada", async () => { render(<WorkoutTimer reps={5} onFinish={() => {}} />); await start(); await advance(3_000); vi.setSystemTime(Date.now() + 4_000); document.dispatchEvent(new Event("visibilitychange")); expect(countdown).toHaveBeenCalledWith(expect.any(Object), 2); countdown.mockClear(); vi.setSystemTime(Date.now() + 64_000); document.dispatchEvent(new Event("visibilitychange")); expect(countdown).not.toHaveBeenCalled(); });
  it("mantém round de dois dígitos e extremos do cronômetro íntegros em dez rounds", async () => { const prescription: SessionPrescription = { track: "push", exerciseKey: "floor-push-up", repsPerSet: 5, sets: 10, totalVolume: 50 }; render(<WorkoutTimer prescriptions={[prescription]} onFinish={() => {}} />); await start(); await advance(560_000); expect(screen.getByText("Série 10 de 10")).toBeVisible(); expect(screen.getByRole("timer", { name: "50 segundos" })).toHaveTextContent("00:50"); await advance(49_000); expect(screen.getByRole("timer", { name: "1 segundo" })).toHaveTextContent("00:01"); });
  it("confirma interrupção sem estimar volume", async () => { const stop = vi.fn(); render(<WorkoutTimer reps={7} onFinish={() => {}} onInterrupt={stop} />); await start(); await advance(12_000); fireEvent.click(screen.getByRole("button", { name: "Pausar" })); fireEvent.click(screen.getByRole("button", { name: "Encerrar" })); expect(screen.getByText(/nenhum volume será estimado/)).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: "Marcar como interrompido" })); expect(stop).toHaveBeenCalled(); });
});
