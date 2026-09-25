import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prototypeToday, timelineDates } from "@/mocks/data";
import { Trail } from "./Trail";

afterEach(cleanup);

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Trail", () => {
  it("mantém a marca sem título de data no cabeçalho e sem ícones", () => {
    const { container } = render(<Trail />);
    const header = container.querySelector(".timeline-header")!;
    expect(within(header as HTMLElement).getByText("CALIBRE")).toBeVisible();
    expect(header.querySelector("h1, h2, svg")).toBeNull();
    fireEvent.scroll(window, { target: { scrollY: 100 } });
    expect(within(header as HTMLElement).getByText("CALIBRE")).toBeVisible();
    expect(container.querySelector(".trail-page svg")).toBeNull();
  });

  it("oferece cabeçalhos de trilha e uma célula por data e trilha", () => {
    render(<Trail />);
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([
      "Data",
      expect.stringContaining("Empurrar"),
      expect.stringContaining("Puxar"),
      expect.stringContaining("Pernas"),
      expect.stringContaining("Core"),
    ]);
    const todayRow = document.querySelector(`[data-date="${prototypeToday}"]`)!;
    expect(within(todayRow as HTMLElement).getAllByRole("cell")).toHaveLength(
      4,
    );
    expect(
      within(todayRow as HTMLElement).getByRole("rowheader"),
    ).toHaveTextContent("Hoje");
  });

  it("separa semanticamente meses e semanas", () => {
    render(<Trail />);
    expect(
      document.querySelectorAll(".month-group[role=rowgroup]").length,
    ).toBeGreaterThan(1);
    expect(
      document.querySelectorAll(".week-group[role=rowgroup]").length,
    ).toBeGreaterThan(1);
    expect(screen.getAllByRole("heading", { level: 2 })[0]).toHaveTextContent(
      "setembro de 2026",
    );
    expect(screen.getAllByRole("heading", { level: 3 })[0]).toHaveTextContent(
      "Semana de",
    );
  });

  it("começa hoje, ordena o histórico para trás e não inclui futuro", () => {
    render(<Trail />);
    const dates = [
      ...document.querySelectorAll<HTMLElement>("[data-date]"),
    ].map((row) => row.dataset.date!);
    expect(dates[0]).toBe(prototypeToday);
    expect(dates).toEqual(timelineDates);
    expect(
      dates.every((date, index) => index === 0 || date < dates[index - 1]),
    ).toBe(true);
    expect(dates.every((date) => date <= prototypeToday)).toBe(true);
  });

  it("ordena sessões independentes e omite challenges", () => {
    render(<Trail />);
    const row = document.querySelector('[data-date="2026-09-02"]')!;
    const nodes = within(row as HTMLElement).getAllByRole("button", {
      name: /Empurrar/,
    });
    expect(nodes.map((node) => node.getAttribute("aria-label"))).toEqual([
      expect.stringContaining("06:50"),
      expect.stringContaining("12:20"),
    ]);
    expect(
      within(row as HTMLElement).getByRole("button", { name: "+1" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/challenge/i)).not.toBeInTheDocument();
  });

  it("abre o fluxo pelo botão Treinar e navega ao próximo grupo", () => {
    render(<Trail />);
    fireEvent.click(screen.getByRole("button", { name: "Treinar" }));
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Fechar" }));
    const older = screen.getByRole("button", {
      name: "Ir para datas anteriores",
    });
    fireEvent.click(older);
    const groups = document.querySelectorAll(".week-group");
    expect(groups[1].scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("abre e fecha detalhes por botão, backdrop e Escape, usando o nome da trilha", () => {
    render(<Trail />);
    fireEvent.click(
      screen.getByRole("button", { name: /Empurrar, 07:10, 50/ }),
    );
    expect(screen.getByRole("dialog", { name: /Flexão/ })).toHaveTextContent(
      "Trilha: Empurrar",
    );
    expect(screen.getByRole("dialog").querySelector("svg")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Empurrar, 07:10, 50/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Fechar detalhes" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
