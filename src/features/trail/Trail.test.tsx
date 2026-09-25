import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTimelineDates, localDateString } from "@/mocks/data";
import { Trail } from "./Trail";

afterEach(cleanup);
const scrollIntoView = vi.fn();
beforeEach(() => { scrollIntoView.mockClear(); Element.prototype.scrollIntoView = scrollIntoView; window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }); });

describe("Trail", () => {
  it("gera uma janela com passado, hoje e futuro", () => { const dates = createTimelineDates(); const today = localDateString(); expect(dates).toContain(today); expect(dates[0] < today).toBe(true); expect(dates.at(-1)! > today).toBe(true); });
  it("posiciona hoje uma única vez e mantém passado acima e futuro abaixo", () => { render(<Trail/>); const today = localDateString(); const dates = [...document.querySelectorAll<HTMLElement>("[data-date]")].map(row => row.dataset.date!); expect(dates.indexOf(today)).toBeGreaterThan(0); expect(dates[dates.indexOf(today)-1] < today).toBe(true); expect(dates[dates.indexOf(today)+1] > today).toBe(true); expect(scrollIntoView).toHaveBeenCalledTimes(1); fireEvent.scroll(document.querySelector(".calendar-scroll")!); expect(scrollIntoView).toHaveBeenCalledTimes(1); });
  it("aplica estados e oferece a ação contextual apenas hoje", () => { render(<Trail/>); const today = localDateString(), row = document.querySelector<HTMLElement>(`[data-date="${today}"]`)!; expect(row).toHaveClass("is-today"); expect(row.previousElementSibling).toHaveClass("is-past"); expect(row.nextElementSibling).toHaveClass("is-future"); expect(within(row).getByText("Hoje")).toBeVisible(); expect(within(row).getByRole("button", { name: "Iniciar EMOM de 5 min" })).toBeVisible(); expect(document.querySelectorAll(".today-start")).toHaveLength(1); });
  it("mantém quatro colunas e abre o treino recomendado", () => { render(<Trail/>); const row = document.querySelector<HTMLElement>(`[data-date="${localDateString()}"]`)!; expect(within(row).getAllByRole("cell")).toHaveLength(4); fireEvent.click(within(row).getByRole("button", { name: "Iniciar EMOM de 5 min" })); expect(screen.getByRole("dialog", { name: "Montar treino" })).toBeVisible(); });
});
