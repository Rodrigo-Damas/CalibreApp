import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addLocalDays, createTimelineDates, demoSessions, localDateString, tracks, type WorkoutSession } from "@/mocks/data";
import { MockStoreProvider } from "@/mocks/store";
import { Trail } from "./Trail";

afterEach(cleanup);
const scroll = vi.fn();
beforeEach(() => { localStorage.clear(); Element.prototype.scrollIntoView = scroll; scroll.mockClear(); });
const setup = () => render(<MockStoreProvider><Trail /></MockStoreProvider>);
const prescription = (track: "push" | "pull") => ({ track, exerciseKey: track === "push" ? "floor-push-up" as const : "pull-up" as const, suggestedShortReps: 10, chosenShortReps: 10, displayedReps: 10, sets: 5 as const, estimatedVolume: 50 });
const specialSessions: WorkoutSession[] = [
  { id: "combined", combinedId: "combined", date: addLocalDays(localDateString(), -1), time: "08:30", duration: "short", format: "circuit", arrival: "normal", plannedMinutes: 5, elapsedSeconds: 300, status: "completed", perception: "right", prescriptions: [prescription("push"), prescription("pull")] },
  { id: "interrupted", combinedId: "interrupted", date: addLocalDays(localDateString(), -3), time: "09:15", duration: "short", format: "blocks", arrival: "slow", plannedMinutes: 5, elapsedSeconds: 90, status: "interrupted", prescriptions: [prescription("push")] },
];

describe("Trail", () => {
  it("possui exatamente quatro trilhas", () => expect(tracks).toHaveLength(4));
  it("remove os textos promocionais e mostra as quatro trilhas", () => { setup(); expect(screen.queryByText("AGENDA DE TREINO")).not.toBeInTheDocument(); expect(screen.queryByText("Seu plano, no seu ritmo.")).not.toBeInTheDocument(); tracks.forEach(({ name }) => expect(screen.getAllByText(name).length).toBeGreaterThan(0)); });
  it("termina hoje e não cria futuro", () => { const dates = createTimelineDates(); const today = localDateString(); expect(dates.at(-1)).toBe(today); expect(dates.every((date) => date <= today)).toBe(true); });
  it("abre posicionada em hoje e identifica cabeçalhos fixos", () => { setup(); expect(scroll).toHaveBeenCalledOnce(); expect(screen.getByLabelText("Cabeçalhos fixos das trilhas")).toBeVisible(); expect(screen.getAllByText(/SEMANA/).length).toBeGreaterThan(0); const dates = [...document.querySelectorAll<HTMLElement>("[data-date]")]; expect(dates.at(-1)?.dataset.date).toBe(localDateString()); });
  it("seleciona, remove e inicia uma ou mais trilhas", () => { setup(); const row = document.querySelector<HTMLElement>(`[data-date="${localDateString()}"]`)!; const start = within(row).getByRole("button", { name: /Selecione uma ou mais trilhas/ }); expect(within(row).getAllByRole("button", { pressed: false })).toHaveLength(4); expect(start).toBeDisabled(); const push = within(row).getByRole("button", { name: "Selecionar Empurrar para o treino" }); fireEvent.click(push); expect(within(row).getByRole("button", { name: "Remover Empurrar do treino" })).toHaveAttribute("aria-pressed", "true"); fireEvent.click(within(row).getByRole("button", { name: "Remover Empurrar do treino" })); expect(start).toBeDisabled(); fireEvent.click(within(row).getByRole("button", { name: "Selecionar Empurrar para o treino" })); fireEvent.click(within(row).getByRole("button", { name: "Selecionar Pernas para o treino" })); expect(start).toBeEnabled(); expect(start).toHaveTextContent("2 trilhas selecionadas"); fireEvent.click(start); expect(screen.getByText("Quanto você tem no tanque hoje?")).toBeVisible(); fireEvent.click(screen.getByRole("radio", { name: "Normal" })); expect(screen.getByRole("row", { name: /Empurrar 5 min/ })).toBeVisible(); expect(screen.getByRole("row", { name: /Pernas 5 min/ })).toBeVisible(); });
  it("abre por uma trilha específica diretamente na condição", () => { setup(); fireEvent.click(screen.getByRole("button", { name: "Iniciar treino com Puxar" })); expect(screen.getByText("Quanto você tem no tanque hoje?")).toBeVisible(); expect(screen.queryByText("O que entra neste treino?")).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("radio", { name: "Normal" })); expect(screen.getByRole("row", { name: /Puxar 5 min 7 por série/ })).toBeVisible(); });
  it("renderiza marcador comum, combinado, recorde e interrompido", () => { localStorage.setItem("calibre-state-v2", JSON.stringify({ sessions: [...demoSessions, ...specialSessions], preferences: {} })); setup(); expect(screen.getByRole("button", { name: /Empurrar, às 07:10, 70 repetições/ })).toBeVisible(); expect(screen.getAllByRole("button", { name: /treino combinado/ }).length).toBe(2); expect(screen.getByRole("button", { name: /Core, às 07:10, 45 repetições, recorde pessoal/ })).toBeVisible(); expect(screen.getByRole("button", { name: /Empurrar, às 09:15, treino interrompido/ })).toBeVisible(); });
});
