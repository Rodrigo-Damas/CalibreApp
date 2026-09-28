import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockStoreProvider } from "@/mocks/store";
import { WorkoutFlow } from "./WorkoutFlow";

afterEach(cleanup);
beforeEach(() => localStorage.clear());
const setup = () => render(<MockStoreProvider><WorkoutFlow onClose={() => {}} /></MockStoreProvider>);
function choose(...names: string[]) { names.forEach((name) => fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }))); fireEvent.click(screen.getByRole("button", { name: "Continuar" })); }

describe("WorkoutFlow", () => {
  it("mostra hierarquia e ordem das trilhas antes de avançar", () => { setup(); fireEvent.click(screen.getByRole("button", { name: /Empurrar/ })); fireEvent.click(screen.getByRole("button", { name: /Puxar/ })); expect(screen.getByText("1. Empurrar — Flexão no solo")).toBeVisible(); expect(screen.getByText("2. Puxar — Barra fixa")).toBeVisible(); });
  it("exibe 5 séries e repetições por série sem recomendações", () => { setup(); choose("Empurrar"); expect(screen.getByText("5 séries")).toBeVisible(); expect(screen.getByText("14 repetições por série em todas elas")).toBeVisible(); expect(screen.queryByText(/sugestão|incentivo|voltar à/i)).not.toBeInTheDocument(); });
  it("mantém as mesmas repetições e mostra 10 séries no longo", () => { setup(); choose("Empurrar"); fireEvent.click(screen.getByRole("button", { name: /Longo/ })); expect(screen.getByText("10 séries")).toBeVisible(); expect(screen.getByText("14 repetições por série em todas elas")).toBeVisible(); });
  it("pré-visualiza blocos agrupados e circuito em rodadas", () => { setup(); choose("Empurrar", "Puxar"); expect(screen.getByText("5 séries agrupadas · 14 repetições por série")).toBeVisible(); const formats = screen.getByRole("group", { name: "Formato do treino" }); fireEvent.click(within(formats).getByRole("button", { name: /Circuito/ })); expect(screen.getByText("Rodada 1")).toBeVisible(); expect(screen.getByText("Rodada 5")).toBeVisible(); });
  it("pede confirmação acessível antes do cronômetro e fecha por Escape", () => { setup(); choose("Empurrar"); fireEvent.click(screen.getByRole("button", { name: "Revisar e começar" })); const dialog = screen.getByRole("dialog", { name: "Você está preparada?" }); expect(within(dialog).getByText(/5 séries · 14 repetições por série/)).toBeVisible(); expect(screen.getByRole("button", { name: "Sim, iniciar cronômetro" })).toHaveFocus(); fireEvent.keyDown(document, { key: "Escape" }); expect(screen.queryByRole("dialog", { name: "Você está preparada?" })).not.toBeInTheDocument(); });
  it("inicia somente após a confirmação", () => { setup(); choose("Empurrar"); fireEvent.click(screen.getByRole("button", { name: "Revisar e começar" })); fireEvent.click(screen.getByRole("button", { name: "Sim, iniciar cronômetro" })); expect(screen.getByRole("dialog", { name: "Cronômetro" })).toBeVisible(); });
});
