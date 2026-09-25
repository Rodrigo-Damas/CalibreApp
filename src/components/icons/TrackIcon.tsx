import type { TrackId } from "@/mocks/data";

const names: Record<TrackId, string> = {
  push: "Flexão",
  pull: "Barra fixa",
  legs: "Agachamento",
  core: "Abdominal",
};

/** A compact, original set of movement illustrations shared across the journey. */
export function TrackIcon({ track, className, decorative = false }: {
  track: TrackId;
  className?: string;
  decorative?: boolean;
}) {
  return <svg className={`track-illustration ${className ?? ""}`} viewBox="0 0 96 72" role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : names[track]}>
    <circle className="track-illustration__halo" cx="48" cy="35" r="27" />
    <g className="track-illustration__figure" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {track === "push" && <><circle cx="72" cy="20" r="5" /><path d="M13 57h68M20 53l16-23 31 14 8 13M36 30 19 45M49 36l11 20" /><path className="track-illustration__accent" d="m27 44 11-10 21 9" /></>}
      {track === "pull" && <><path d="M17 10h62M26 10v10m44-10v10M26 20l17 10m27-10L53 30" /><circle cx="48" cy="29" r="5" /><path d="M44 35 36 49l12 13m4-27 8 14-9 13M36 49l12 3 12-3" /><path className="track-illustration__accent" d="m39 42 9 10 9-10" /></>}
      {track === "legs" && <><circle cx="52" cy="14" r="5" /><path d="m49 21-9 18 15 8m-15-8-22 8m37 0 20-4M18 47 9 60m46-13 12 14M30 55h31" /><path className="track-illustration__accent" d="m46 26-6 13 15 8" /></>}
      {track === "core" && <><circle cx="22" cy="31" r="5" /><path d="M14 58h67M28 36l19 15 19-6m-19 6-16 7m35-13 14-20M34 40l15-8 18 13" /><path className="track-illustration__accent" d="m31 40 16 11 12-4" /></>}
    </g>
    <path className="track-illustration__ground" d="M13 63h70" />
  </svg>;
}
