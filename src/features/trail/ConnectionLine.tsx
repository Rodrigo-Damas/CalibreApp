import { trackIds, type WorkoutSession } from "@/mocks/data";

export function ConnectionLine({ sessions }: { sessions: WorkoutSession[] }) {
  return <svg className="connection-lines" aria-label="Conexões de treinos combinados" preserveAspectRatio="none">
    {sessions.filter((session) => session.prescriptions.length > 1).map((session) => {
      const positions = session.prescriptions.map((item) => trackIds.indexOf(item.track)).filter((index) => index >= 0);
      const first = Math.min(...positions);
      const last = Math.max(...positions);
      const x1 = 12.5 + first * 25;
      const x2 = 12.5 + last * 25;
      return <path key={session.id} data-combined-id={session.combinedId} d={`M ${x1} 50 C ${x1} 22, ${x2} 22, ${x2} 50`} />;
    })}
  </svg>;
}
