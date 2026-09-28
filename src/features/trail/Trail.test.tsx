import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDateString, tracks, type WorkoutSession } from "@/mocks/data";
import { MockStoreProvider } from "@/mocks/store";
import { Trail } from "./Trail";

afterEach(cleanup);
beforeEach(() => { localStorage.clear(); Element.prototype.scrollIntoView = vi.fn(); });
const prescription = (track: "push" | "pull", reps = 10) => ({ track, exerciseKey: track === "push" ? "floor-push-up" as const : "pull-up" as const, repsPerSet: reps, sets: 5 as const, totalVolume: reps * 5 });
const todaySession: WorkoutSession = { id: "today", combinedId: "today", date: localDateString(), time: "08:30", duration: "short", format: "blocks", arrival: "normal", plannedMinutes: 5, elapsedSeconds: 300, status: "completed", perception: "right", prescriptions: [prescription("push")] };
const setup = (sessions?: WorkoutSession[]) => { if (sessions) localStorage.setItem("calibre-state-v2", JSON.stringify({ sessions, preferences: {} })); return render(<MockStoreProvider><Trail /></MockStoreProvider>); };
const userEvent = {
  async click(element: HTMLElement) {
    fireEvent.pointerDown(element, { button: 0, pointerType: "mouse", isPrimary: true });
    fireEvent.mouseDown(element, { button: 0 });
    element.focus();
    fireEvent.pointerUp(element, { button: 0, pointerType: "mouse", isPrimary: true });
    fireEvent.mouseUp(element, { button: 0 });
    fireEvent.click(element, { button: 0 });
  },
};

describe("Trail", () => {
  it("exibe cabeçalhos passivos e nenhum seletor na linha de hoje", () => { setup(); const row = document.querySelector<HTMLElement>(`[data-date="${localDateString()}"]`)!; expect(within(row).queryAllByRole("button", { pressed: false })).toHaveLength(0); expect(screen.queryByRole("button", { name: /Iniciar treino com/ })).not.toBeInTheDocument(); tracks.forEach(({ name }) => expect(screen.getByLabelText(name)).toBeVisible()); });
  it("oferece um botão semântico fora da agenda e abre sem seleção", () => { setup(); const button = screen.getByRole("button", { name: "Começar treino" }); expect(button).toBeVisible(); expect(button).toHaveAttribute("type", "button"); expect(button.closest(".trail-page")).toBeNull(); fireEvent.click(button); expect(screen.getByRole("dialog", { name: "Montar treino" })).toBeVisible(); expect(screen.getByText("Escolha as trilhas")).toBeVisible(); expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4); expect(screen.queryByRole("button", { name: "Começar treino" })).not.toBeInTheDocument(); });
  it("abre com interação realista e restaura botão e foco ao fechar", async () => { setup(); const button = screen.getByRole("button", { name: "Começar treino" }); await userEvent.click(button); expect(screen.getByRole("dialog", { name: "Montar treino" })).toBeVisible(); expect(screen.getByRole("heading", { name: "Montar treino" })).toHaveFocus(); expect(screen.queryByRole("button", { name: "Começar treino" })).not.toBeInTheDocument(); await userEvent.click(screen.getByRole("button", { name: "Fechar" })); const restored = screen.getByRole("button", { name: "Começar treino" }); expect(restored).toBeVisible(); expect(restored).toHaveFocus(); });
  it("mantém o marcador de hoje e permite iniciar outra sessão", () => { setup([todaySession]); const row = document.querySelector<HTMLElement>(`[data-date="${localDateString()}"]`)!; expect(within(row).getByRole("button", { name: /Empurrar, às 08:30, 50 repetições/ })).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: /Começar treino/ })); expect(screen.getByText("Escolha as trilhas")).toBeVisible(); expect(screen.getByText("Treinada hoje")).toBeVisible(); });
  it("oculta o botão durante resumo e montagem", () => { setup([todaySession]); fireEvent.click(screen.getByRole("button", { name: /Empurrar, às 08:30/ })); expect(screen.queryByRole("button", { name: /Começar treino/ })).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Fechar resumo" })); fireEvent.click(screen.getByRole("button", { name: /Começar treino/ })); expect(screen.queryByRole("button", { name: /Começar treino/ })).not.toBeInTheDocument(); });
  it("abre a montagem depois de fechar um resumo", async () => { setup([todaySession]); await userEvent.click(screen.getByRole("button", { name: /Empurrar, às 08:30/ })); await userEvent.click(screen.getByRole("button", { name: "Fechar resumo" })); await userEvent.click(screen.getByRole("button", { name: "Começar treino" })); expect(screen.getByRole("dialog", { name: "Montar treino" })).toBeVisible(); });
});
