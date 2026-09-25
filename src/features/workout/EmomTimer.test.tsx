import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EmomTimer } from "./EmomTimer";
import { playEmomSignal } from "./emomAudio";

vi.mock("./emomAudio", async importOriginal => {
  const original = await importOriginal<typeof import("./emomAudio")>();
  return { ...original, enableEmomAudio: vi.fn(), playEmomSignal: vi.fn() };
});
const signal = vi.mocked(playEmomSignal);
const advance = async (milliseconds: number) => { await act(async () => { vi.advanceTimersByTime(milliseconds); }); };

describe("EmomTimer", () => {
  beforeEach(() => { vi.useFakeTimers(); signal.mockClear(); localStorage.clear(); Object.defineProperty(navigator, "vibrate", { configurable: true, value: vi.fn() }); });
  afterEach(() => { cleanup(); vi.useRealTimers(); });
  it("executa cinco minutos de 60 segundos, avisos e uma virada por minuto", async () => {
    const finish = vi.fn(); render(<EmomTimer exercise="Flexão" reps={12} onFinish={finish}/>); fireEvent.click(screen.getByRole("button", { name: "Iniciar" }));
    await advance(55_100); expect(signal.mock.calls.filter(([kind]) => kind === "warning")).toHaveLength(1);
    await advance(4_900); expect(signal.mock.calls.filter(([kind]) => kind === "warning")).toHaveLength(5); expect(signal.mock.calls.filter(([kind]) => kind === "minute")).toHaveLength(1); expect(screen.getByText("Minuto 2 de 5")).toBeVisible();
    await advance(240_000); expect(signal.mock.calls.filter(([kind]) => kind === "minute")).toHaveLength(4); expect(signal.mock.calls.filter(([kind]) => kind === "finish")).toHaveLength(1); expect(finish).toHaveBeenCalledOnce();
  });
  it("não duplica sinais ao pausar e continuar e permanece visual sem som", async () => {
    render(<EmomTimer exercise="Barra fixa" reps={7} onFinish={() => {}}/>); fireEvent.click(screen.getByLabelText("Som")); fireEvent.click(screen.getByRole("button", { name: "Iniciar" })); await advance(56_000); fireEvent.click(screen.getByRole("button", { name: "Pausar" })); const count = signal.mock.calls.length; await advance(20_000); expect(signal).toHaveBeenCalledTimes(count); fireEvent.click(screen.getByRole("button", { name: "Continuar" })); await advance(4_000); expect(signal.mock.calls.filter(([kind]) => kind === "minute")).toHaveLength(1); expect(screen.getByText(/Descanse até o próximo minuto/)).toBeVisible();
  });
});
