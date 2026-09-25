import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MockStoreProvider } from "@/mocks/store";
import { WorkoutFlow } from "./WorkoutFlow";

afterEach(cleanup);
beforeEach(() => localStorage.clear());
const setup = (initialTrack?: "push") => render(<MockStoreProvider><WorkoutFlow onClose={() => {}} initialTrack={initialTrack} /></MockStoreProvider>);
function select(...names: string[]) { names.forEach((name) => fireEvent.click(screen.getByRole("button", { name: new RegExp(name) }))); fireEvent.click(screen.getByRole("button", { name: "Continuar" })); }
function arrive() { fireEvent.click(screen.getByRole("radio", { name: "Normal" })); }

describe("WorkoutFlow", () => {
  it("não pré-seleciona trilha na entrada neutra", () => { setup(); expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4); expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled(); });
  it("inicia na condição somente quando recebe uma trilha", () => { setup("push"); expect(screen.getByText("Quanto você tem no tanque hoje?")).toBeVisible(); arrive(); expect(screen.getByRole("row", { name: /Empurrar 5 min/ })).toBeVisible(); });
  it("mostra cinco níveis acessíveis sem expor ajustes numéricos", () => { setup(); select("Empurrar"); const group = screen.getByRole("radiogroup", { name: "Nível de energia" }); expect(within(group).getAllByRole("radio")).toHaveLength(5); ["−2", "−1", "0", "+1"].forEach((value) => expect(screen.queryByText(value, { exact: true })).not.toBeInTheDocument()); });
  it("alterna curto e longo na mesma tela e atualiza toda a prévia", () => { setup(); select("Empurrar", "Puxar"); arrive(); expect(screen.getByText("10 minutos no total")).toBeVisible(); expect(screen.getByRole("row", { name: /Empurrar 5 min 14 por série 70/ })).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: "Longo" })); expect(screen.getByText("Escolha um ritmo para todas as trilhas")).toBeVisible(); expect(screen.getByRole("button", { name: "Longo" })).toHaveAttribute("aria-pressed", "true"); expect(screen.getByText("20 minutos no total")).toBeVisible(); expect(screen.getByRole("row", { name: /Empurrar 10 min 7 por série 70/ })).toBeVisible(); expect(screen.getByLabelText("Ordem em Blocos").children).toHaveLength(20); });
  it("avança apenas depois de Continuar", () => { setup(); select("Empurrar", "Puxar"); arrive(); fireEvent.click(screen.getByRole("button", { name: "Longo" })); expect(screen.queryByText("Como as trilhas se alternam?")).not.toBeInTheDocument(); fireEvent.click(screen.getByRole("button", { name: "Continuar" })); expect(screen.getByText("Como as trilhas se alternam?")).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: /Circuito/ })); expect(screen.getByLabelText("Aumentar repetições de Empurrar")).toBeVisible(); expect(screen.getByText(/7 por série · 10 minutos/)).toBeVisible(); });
});
