import { PersonStanding } from "lucide-react";
import type { TrackId } from "@/mocks/data";

export function TrackIcon({track,className}:{track:TrackId;className?:string}){
  if(track==="core")return <PersonStanding className={className} aria-hidden="true"/>;
  return <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {track==="push"&&<><circle cx="23" cy="10" r="3"/><path d="M5 24h22M9 21l4-7 9 4 4 6M13 14l-5 4"/></>}
    {track==="pull"&&<><path d="M5 5h22M8 5v3M24 5v3"/><circle cx="16" cy="12" r="3"/><path d="M10 8l3 2m9-2-3 2m-3 5v11m0-7-6 6m6-6 6 6"/></>}
    {track==="legs"&&<><circle cx="16" cy="6" r="3"/><path d="M16 9v8m0-4-7 3m7-3 7 3m-7 1-6 9m6-9 6 9M6 16h20"/></>}
    {track==="cardio"&&<><path d="M9 8c-5 3-5 15 0 18m14-18c5 3 5 15 0 18M9 8l4 11m10-11-4 11"/><circle cx="16" cy="8" r="3"/><path d="M13 12l3 6 3-6m-6 14 3-8 3 8"/></>}
  </svg>
}
