import type { DurationChoice, SessionPrescription, TrackId, WorkoutSession } from "@/mocks/data";

export const SETS = { short: 5, long: 10 } as const;

export function prescriptionOf(session: WorkoutSession, track: TrackId) {
  return session.prescriptions.find((prescription) => prescription.track === track);
}

export function completedForTrack(history: WorkoutSession[], track: TrackId) {
  return history.filter((session) => session.status === "completed" && prescriptionOf(session, track));
}

/** Reuses exactly the repetitions performed in the latest completed session. */
export function repetitionsReference(track: TrackId, initial: number, history: WorkoutSession[]) {
  const latest = completedForTrack(history, track).at(-1);
  return latest ? prescriptionOf(latest, track)!.repsPerSet : initial;
}

export function totalVolume(repsPerSet: number, duration: DurationChoice) {
  return repsPerSet * SETS[duration];
}

export function makePrescription(
  track: TrackId,
  exerciseKey: SessionPrescription["exerciseKey"],
  repsPerSet: number,
  duration: DurationChoice,
): SessionPrescription {
  const sets = SETS[duration];
  return { track, exerciseKey, repsPerSet, sets, totalVolume: repsPerSet * sets };
}

export function sequence<T extends { track: TrackId }>(items: T[], sets: number, format: "blocks" | "circuit") {
  return format === "blocks"
    ? items.flatMap((item) => Array.from({ length: sets }, () => item))
    : Array.from({ length: sets }, () => items).flat();
}

export type PerformanceState = "maintenance" | "increase" | "personal-record";
export type PerformanceComparison = {
  state: PerformanceState;
  currentVolume: number;
  previousVolume?: number;
  delta?: number;
  historicalBest?: number;
};

/** Compares only completed sessions; an interrupted session never becomes a reference. */
export function compareCompletedPerformance(
  track: TrackId,
  current: SessionPrescription,
  history: WorkoutSession[],
): PerformanceComparison {
  const prior = completedForTrack(history, track).map((session) => prescriptionOf(session, track)!);
  const previousVolume = prior.at(-1)?.totalVolume;
  const historicalBest = prior.length ? Math.max(...prior.map((item) => item.totalVolume)) : undefined;
  const currentVolume = current.totalVolume;
  const delta = previousVolume === undefined ? undefined : currentVolume - previousVolume;
  const state: PerformanceState = historicalBest !== undefined && currentVolume > historicalBest
    ? "personal-record"
    : previousVolume !== undefined && currentVolume > previousVolume
      ? "increase"
      : "maintenance";
  return { state, currentVolume, previousVolume, delta, historicalBest };
}
