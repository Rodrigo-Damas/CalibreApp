import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { localDateString, type TrackId } from "@/mocks/data";
import { MockStoreProvider } from "@/mocks/store";
import { WorkoutFlow } from "./WorkoutFlow";

afterEach(cleanup);
beforeEach(() => localStorage.clear());
const setup = (props: { initialTrack?: TrackId; initialTracks?: TrackId[] } = {}) => render(<MockStoreProvider><WorkoutFlow onClose={() => {}} {...props} /></MockStoreProvider>);
const trackButton = (name: string) => within(screen.getByLabelText("Escolha de trilhas")).getByRole("button", { name: new RegExp(name) });
const select = (...names: string[]) => names.forEach((name) => fireEvent.click(trackButton(name)));

describe("WorkoutFlow", () => {
  it("reúne seleção e montagem em uma tela, sem etapas ou avanço", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Escolha as trilhas" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Resumo do treino" })).toBeVisible();
    expect(screen.queryByText(/Etapa 1 de 2/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Voltar" })).not.toBeInTheDocument();
  });

  it("mostra estados vazios e bloqueia ações sem seleção", () => {
    setup();
    const summary = screen.getByRole("region", { name: "Resumo do treino" });
    expect(screen.getByText("Nenhuma trilha selecionada")).toBeVisible();
    expect(within(summary).getByText("Selecione uma trilha acima para definir duração, formato e repetições.")).toBeVisible();
    expect(screen.queryByRole("group", { name: "Duração do treino" })).not.toBeInTheDocument();
    expect(screen.queryByText("Repetições por série")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Revisar e começar" })).toBeDisabled();
  });

  it("preserva a ordem e atualiza resumo, duração e prescrições imediatamente", () => {
    setup();
    select("Puxar", "Empurrar");
    expect(screen.getByLabelText("Selecionada na posição 1")).toBeVisible();
    expect(screen.getByLabelText("Selecionada na posição 2")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Puxar · Empurrar" })).toBeVisible();
    const summary = screen.getByRole("region", { name: "Resumo do treino" });
    expect(within(summary).getByText("10 min")).toBeVisible();
    expect(within(summary).getByText("2")).toBeVisible();
    expect(within(summary).getByText("105 repetições")).toBeVisible();
    expect(within(summary).getByText("5 séries · 7 por série · 35 repetições")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /Longo/ }));
    expect(within(summary).getByText("20 min")).toBeVisible();
    expect(within(summary).getByText("210 repetições")).toBeVisible();
    expect(screen.getByText("7 repetições por série em todas elas")).toBeVisible();
  });

  it("atualiza formato, repetições e remoção sem trocar de tela", () => {
    setup();
    select("Empurrar", "Puxar");
    const summary = screen.getByRole("region", { name: "Resumo do treino" });
    fireEvent.click(screen.getByRole("button", { name: /Circuito/ }));
    expect(within(summary).getByText("Circuito")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Aumentar repetições de Empurrar" }));
    expect(within(summary).getByText("110 repetições")).toBeVisible();
    fireEvent.click(trackButton("Empurrar"));
    expect(screen.getByRole("heading", { name: "Puxar" })).toBeVisible();
    expect(within(summary).getByText("5 min")).toBeVisible();
    expect(within(summary).getByText("35 repetições")).toBeVisible();
    expect(screen.queryByRole("group", { name: "Formato do treino" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Selecionada na posição 1")).toBeVisible();
  });

  it("volta ao estado vazio ao remover a última trilha", () => {
    setup();
    select("Core");
    fireEvent.click(trackButton("Core"));
    expect(screen.getByText("Nenhuma trilha selecionada")).toBeVisible();
    expect(screen.getByRole("button", { name: "Revisar e começar" })).toBeDisabled();
  });

  it("mantém o aviso de trilha já realizada hoje", () => {
    localStorage.setItem("calibre-state-v2", JSON.stringify({ preferences: {}, sessions: [{ id: "today", combinedId: "today", date: localDateString(), time: "08:00", duration: "short", format: "blocks", arrival: "normal", plannedMinutes: 5, elapsedSeconds: 300, status: "completed", prescriptions: [{ track: "push", exerciseKey: "floor-push-up", repsPerSet: 14, sets: 5, totalVolume: 70 }] }] }));
    setup();
    expect(screen.getByText("Treino feito hoje")).toBeVisible();
    fireEvent.click(trackButton("Empurrar"));
    expect(screen.getByText("Treino feito hoje. Você pode fazer outra sessão.")).toBeVisible();
  });

  it.each([
    [{ initialTrack: "push" as const }, "Empurrar"],
    [{ initialTracks: ["pull", "core"] as TrackId[] }, "Puxar · Core"],
  ])("inicializa a seleção pelas propriedades", (props, heading) => {
    setup(props);
    expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    expect(screen.getByRole("button", { name: "Revisar e começar" })).toBeEnabled();
  });

  it("confirma, restaura foco ao fechar e inicia o cronômetro", async () => {
    setup({ initialTrack: "push" });
    const trigger = screen.getByRole("button", { name: "Revisar e começar" });
    fireEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Iniciar cronômetro" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(trigger).toHaveFocus());
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "Iniciar cronômetro" }));
    expect(screen.getByRole("dialog", { name: "Cronômetro" })).toBeVisible();
  });
});
