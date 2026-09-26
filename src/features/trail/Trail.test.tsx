import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDateString, tracks, type WorkoutSession } from "@/mocks/data";
import { MockStoreProvider } from "@/mocks/store";
import { Trail } from "./Trail";

afterEach(cleanup);
beforeEach(() => { localStorage.clear(); Element.prototype.scrollIntoView = vi.fn(); });
const prescription = (track: "push" | "pull", reps = 10) => ({ track, exerciseKey: track === "push" ? "floor-push-up" as const : "pull-up" as const, suggestedShortReps: reps, chosenShortReps: reps, displayedReps: reps, sets: 5 as const, estimatedVolume: reps * 5 });
const todaySession: WorkoutSession = { id: "today", combinedId: "today", date: localDateString(), time: "08:30", duration: "short", format: "blocks", arrival: "normal", plannedMinutes: 5, elapsedSeconds: 300, status: "completed", perception: "right", prescriptions: [prescription("push")] };
const setup = (sessions?: WorkoutSession[]) => { if (sessions) localStorage.setItem("calibre-state-v2", JSON.stringify({ sessions, preferences: {} })); return render(<MockStoreProvider><Trail /></MockStoreProvider>); };

describe("Trail", () => {
  it("exibe cabeçalhos passivos e nenhum seletor na linha de hoje", () => { setup(); const row = document.querySelector<HTMLElement>(`[data-date="${localDateString()}"]`)!; expect(within(row).queryAllByRole("button", { pressed: false })).toHaveLength(0); expect(screen.queryByRole("button", { name: /Iniciar treino com/ })).not.toBeInTheDocument(); tracks.forEach(({ name }) => expect(screen.getByLabelText(name)).toBeVisible()); });
  it("oferece um único botão flutuante e abre sem seleção", () => { setup(); const button = screen.getByRole("button", { name: /Começar treino/ }); expect(button).toBeVisible(); fireEvent.click(button); expect(screen.getByText("O que entra neste treino?")).toBeVisible(); expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4); expect(screen.queryByRole("button", { name: /Começar treino/ })).not.toBeInTheDocument(); });
  it("mantém o marcador de hoje e permite iniciar outra sessão", () => { setup([todaySession]); const row = document.querySelector<HTMLElement>(`[data-date="${localDateString()}"]`)!; expect(within(row).getByRole("button", { name: /Empurrar, às 08:30, 50 repetições/ })).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: /Começar treino/ })); expect(screen.getByText("O que entra neste treino?")).toBeVisible(); expect(screen.getByText("Treinada hoje")).toBeVisible(); });
  it("oculta o botão durante resumo e montagem", () => { setup([todaySession]); fireEvent.click(screen.getByRole("button", { name: /Empurrar, às 08:30/ })); expect(screen.queryByRole("button", { name: /Começar treino/ })).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Fechar resumo" })); fireEvent.click(screen.getByRole("button", { name: /Começar treino/ })); expect(screen.queryByRole("button", { name: /Começar treino/ })).not.toBeInTheDocument(); });
});
