import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTimelineDates, localDateString, tracks } from "@/mocks/data";
import { MockStoreProvider } from "@/mocks/store";
import { Trail } from "./Trail";

afterEach(cleanup);
const scroll = vi.fn();
beforeEach(() => { localStorage.clear(); Element.prototype.scrollIntoView = scroll; scroll.mockClear(); });
const setup = () => render(<MockStoreProvider><Trail /></MockStoreProvider>);

describe("Trail", () => {
  it("possui exatamente quatro trilhas", () => expect(tracks).toHaveLength(4));
  it("termina hoje e não cria futuro", () => { const dates = createTimelineDates(); const today = localDateString(); expect(dates.at(-1)).toBe(today); expect(dates.every((date) => date <= today)).toBe(true); });
  it("abre posicionada em hoje e identifica cabeçalhos fixos", () => { setup(); expect(scroll).toHaveBeenCalledOnce(); expect(screen.getByLabelText("Cabeçalhos fixos das trilhas")).toBeVisible(); expect(screen.getAllByText(/SEMANA/).length).toBeGreaterThan(0); expect(screen.getAllByLabelText(/treinos nos últimos 14 dias/)).toHaveLength(4); const dates = [...document.querySelectorAll<HTMLElement>("[data-date]")]; expect(dates.at(-1)?.dataset.date).toBe(localDateString()); });
  it("seleciona as trilhas de hoje antes de iniciar", () => { setup(); const row = document.querySelector<HTMLElement>(`[data-date="${localDateString()}"]`)!; const start = within(row).getByRole("button", { name: "Iniciar treino" }); expect(within(row).getAllByRole("button", { pressed: false })).toHaveLength(4); expect(start).toBeDisabled(); fireEvent.click(within(row).getByRole("button", { name: "Adicionar Empurrar ao treino" })); fireEvent.click(within(row).getByRole("button", { name: "Adicionar Pernas ao treino" })); expect(start).toBeEnabled(); expect(start).toHaveTextContent("2 trilhas"); fireEvent.click(start); expect(screen.getByText("Quanto você tem no tanque hoje?")).toBeVisible(); fireEvent.click(screen.getByRole("radio", { name: "Normal" })); expect(screen.getByRole("row", { name: /Empurrar 5 min/ })).toBeVisible(); expect(screen.getByRole("row", { name: /Pernas 5 min/ })).toBeVisible(); });
  it("abre por uma trilha específica diretamente na condição", () => { setup(); fireEvent.click(screen.getByRole("button", { name: "Iniciar treino com Puxar" })); expect(screen.getByText("Quanto você tem no tanque hoje?")).toBeVisible(); expect(screen.queryByText("O que entra neste treino?")).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("radio", { name: "Normal" })); expect(screen.getByRole("row", { name: /Puxar 5 min 7 por série/ })).toBeVisible(); });
});
