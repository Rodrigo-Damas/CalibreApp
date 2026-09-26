import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockStoreProvider } from "@/mocks/store";
import { WorkoutFlow } from "./WorkoutFlow";

afterEach(cleanup);
beforeEach(() => localStorage.clear());
const setup = () => render(<MockStoreProvider><WorkoutFlow onClose={() => {}} /></MockStoreProvider>);
function choose(...names: string[]) { names.forEach((name) => fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }))); fireEvent.click(screen.getByRole("button", { name: "Montar ficha" })); }

describe("WorkoutFlow", () => {
  it("começa pelas trilhas e não pergunta por energia ou disposição", () => { setup(); expect(screen.getByText("O que entra neste treino?")).toBeVisible(); expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4); expect(screen.queryByText(/tanque|energia|disposição/i)).not.toBeInTheDocument(); });
  it("avança diretamente para uma ficha completa", () => { setup(); choose("Empurrar"); expect(screen.getByText("Sua sessão")).toBeVisible(); expect(screen.getByText("Flexão no solo")).toBeVisible(); expect(screen.getByText("5 séries × 14 repetições")).toBeVisible(); expect(screen.getByText("70 repetições estimadas")).toBeVisible(); });
  it("alterna curto e longo atualizando séries e recomendação", () => { setup(); choose("Empurrar"); fireEvent.click(screen.getByRole("button", { name: /Longo/ })); expect(screen.getByText("10 séries × 7 repetições")).toBeVisible(); expect(screen.getByText("70 repetições estimadas")).toBeVisible(); expect(screen.getByText("10 minutos estimados")).toBeVisible(); });
  it("edita cada trilha de forma independente", () => { setup(); choose("Empurrar", "Puxar"); fireEvent.click(screen.getByLabelText("Aumentar repetições de Empurrar")); expect(screen.getByText("5 séries × 15 repetições")).toBeVisible(); expect(screen.getByText("75 repetições estimadas")).toBeVisible(); expect(screen.getByText("5 séries × 7 repetições")).toBeVisible(); });
  it("permite blocos ou circuito e inicia com os valores exibidos", () => { setup(); choose("Empurrar", "Puxar"); const formats = screen.getByRole("group", { name: "Formato do treino" }); fireEvent.click(within(formats).getByRole("button", { name: /Circuito/ })); expect(screen.getByText(/Em circuito/)).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: "Começar treino" })); expect(screen.getByRole("dialog", { name: "Cronômetro" })).toBeVisible(); });
});
