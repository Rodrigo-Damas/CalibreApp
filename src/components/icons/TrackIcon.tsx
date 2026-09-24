import type {TrackId} from "@/mocks/data";
const names:Record<TrackId,string>={push:"Flexão",pull:"Barra fixa",legs:"Agachamento",core:"Elevação de pernas"};
export function TrackIcon({track,className,decorative=false}:{track:TrackId;className?:string;decorative?:boolean}){return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" role={decorative?undefined:"img"} aria-hidden={decorative||undefined} aria-label={decorative?undefined:names[track]}>
 {track==="push"&&<><circle cx="24" cy="11" r="2.5"/><path d="M4 24h24M8 21l6-7 9 4 3 6M14 14l-6 4"/></>}
 {track==="pull"&&<><path d="M5 5h22M9 5v4m14-4v4M9 9l5 3m9-3-5 3"/><circle cx="16" cy="14" r="2.5"/><path d="M16 17v9m0-5-5 5m5-5 5 5"/></>}
 {track==="legs"&&<><circle cx="16" cy="6" r="2.5"/><path d="M16 9v9m0-5-7 3m7-3 7 3m-7 5-5 6m5-6 5 6M7 18h18"/></>}
 {track==="core"&&<><circle cx="25" cy="20" r="2.5"/><path d="M4 25h24M8 23l7-8 8 5m-8-5-3-7m3 7 1-7"/></>}
 </svg>}
