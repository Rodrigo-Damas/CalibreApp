import { describe, expect, it } from "vitest";
import { compareCompletedPerformance, makePrescription, repetitionsReference, sequence, totalVolume } from "./recommendationEngine";
import type { WorkoutSession } from "@/mocks/data";

const session = (reps: number, sets: 5 | 10 = 5, status: WorkoutSession["status"] = "completed"): WorkoutSession => ({ id: crypto.randomUUID(), combinedId: "x", date: "2026-01-01", time: "10:00", duration: sets === 5 ? "short" : "long", format: "blocks", arrival: "normal", plannedMinutes: sets, elapsedSeconds: sets * 60, status, prescriptions: [{ track: "push", exerciseKey: "floor-push-up", repsPerSet: reps, sets, totalVolume: reps * sets }] });

describe("recommendationEngine", () => {
  it("repete exatamente o último número concluído e ignora interrupções", () => expect(repetitionsReference("push", 7, [session(8), session(30, 5, "interrupted")])).toBe(8));
  it("usa o inicial somente sem histórico concluído", () => expect(repetitionsReference("push", 7, [session(30, 5, "interrupted")])).toBe(7));
  it("mantém repetições iguais no curto e longo e altera apenas 5/10 séries", () => { expect(makePrescription("push", "floor-push-up", 7, "short")).toMatchObject({ repsPerSet: 7, sets: 5, totalVolume: 35 }); expect(makePrescription("push", "floor-push-up", 7, "long")).toMatchObject({ repsPerSet: 7, sets: 10, totalVolume: 70 }); expect(totalVolume(7, "long")).toBe(70); });
  it("ordena blocos e circuito", () => { const items = [{ track: "push" as const }, { track: "pull" as const }]; expect(sequence(items, 2, "blocks").map((item) => item.track)).toEqual(["push", "push", "pull", "pull"]); expect(sequence(items, 2, "circuit").map((item) => item.track)).toEqual(["push", "pull", "push", "pull"]); });
  it("não chama a primeira sessão de recorde", () => expect(compareCompletedPerformance("push", session(8).prescriptions[0], []).state).toBe("maintenance"));
  it("distingue aumento do último treino e recorde pessoal por volume", () => { const history = [session(10), session(8)]; expect(compareCompletedPerformance("push", session(9).prescriptions[0], history).state).toBe("increase"); expect(compareCompletedPerformance("push", session(11).prescriptions[0], history).state).toBe("personal-record"); });
  it("exclui interrompidas da comparação", () => expect(compareCompletedPerformance("push", session(9).prescriptions[0], [session(8), session(20, 5, "interrupted")]).state).toBe("personal-record"));
});
