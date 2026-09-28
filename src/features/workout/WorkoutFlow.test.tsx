import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockStoreProvider } from "@/mocks/store";
import { WorkoutFlow } from "./WorkoutFlow";

afterEach(cleanup);
beforeEach(() => localStorage.clear());
const setup = () => render(<MockStoreProvider><WorkoutFlow onClose={() => {}} /></MockStoreProvider>);
function choose(...names: string[]) { names.forEach((name) => fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }))); fireEvent.click(screen.getByRole("button", { name: "Continuar" })); }

describe("WorkoutFlow", () => {
  it("mostra hierarquia e ordem das trilhas antes de avançar", () => { setup(); fireEvent.click(screen.getByRole("button", { name: /Empurrar/ })); fireEvent.click(screen.getByRole("button", { name: /Puxar/ })); expect(screen.getByText("1. Empurrar: Flexão no solo")).toBeVisible(); expect(screen.getByText("2. Puxar: Barra fixa")).toBeVisible(); });
  it("exibe 5 séries e repetições por série sem recomendações", () => { setup(); choose("Empurrar"); expect(screen.getByText("5 séries")).toBeVisible(); expect(screen.getByText("14 repetições por série em todas elas")).toBeVisible(); expect(screen.queryByText(/sugestão|incentivo|voltar à/i)).not.toBeInTheDocument(); });
  it("mantém as mesmas repetições e mostra 10 séries no longo", () => { setup(); choose("Empurrar"); fireEvent.click(screen.getByRole("button", { name: /Longo/ })); expect(screen.getByText("10 séries")).toBeVisible(); expect(screen.getByText("14 repetições por série em todas elas")).toBeVisible(); });
  it("mostra cartões por minuto na ordem real de blocos e circuito", () => { setup(); choose("Empurrar", "Puxar"); const sequence = screen.getByRole("region", { name: "Ordem completa do treino" }); expect(within(sequence).getAllByRole("listitem")).toHaveLength(10); expect(within(sequence).getByRole("listitem", { name: "Minuto 1: Empurrar, Flexão no solo, 14 repetições" })).toBeVisible(); expect(within(sequence).getByRole("listitem", { name: "Minuto 6: Puxar, Barra fixa, 7 repetições" })).toBeVisible(); const formats = screen.getByRole("group", { name: "Formato do treino" }); fireEvent.click(within(formats).getByRole("button", { name: /Circuito/ })); expect(within(sequence).getByRole("listitem", { name: "Minuto 2: Puxar, Barra fixa, 7 repetições" })).toBeVisible(); });
  it("resume a confirmação, mantém foco e fecha por Escape", async () => { setup(); choose("Empurrar"); const trigger = screen.getByRole("button", { name: "Revisar e começar" }); fireEvent.click(trigger); const dialog = screen.getByRole("dialog", { name: "Tudo pronto?" }); expect(within(dialog).getByText("5 minutos")).toBeVisible(); expect(within(dialog).getByText("1")).toBeVisible(); expect(within(dialog).getByText("Blocos")).toBeVisible(); expect(within(dialog).queryByText(/Flexão no solo/)).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Iniciar cronômetro" })).toHaveFocus(); fireEvent.keyDown(document, { key: "Escape" }); expect(screen.queryByRole("dialog", { name: "Tudo pronto?" })).not.toBeInTheDocument(); await waitFor(() => expect(trigger).toHaveFocus()); });
  it("inicia somente após a confirmação", () => { setup(); choose("Empurrar"); fireEvent.click(screen.getByRole("button", { name: "Revisar e começar" })); fireEvent.click(screen.getByRole("button", { name: "Iniciar cronômetro" })); expect(screen.getByRole("dialog", { name: "Cronômetro" })).toBeVisible(); });
});
