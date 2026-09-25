export type TrackId = "push" | "pull" | "legs" | "core";
export type Effort = "Muito fáceis" | "Fáceis" | "Moderadas" | "Difíceis" | "Muito difíceis" | "Não completei";
export type SuggestionResult = "Fiz" | "Em parte" | "Não fiz";

export type HistoryResult = { id:string; date:string; exercise:string; sets:number; repsPerSet:number; volume:number };
export type Practice = { id:string; track:TrackId; capabilities:TrackId[]; name:string; unit:"repetições"; repsPerSet:number; sets:number; durationMinutes:number; totalVolume:number };
export type Track = { id:TrackId; name:string; color:string; exercise:string; unit:"repetições"; history:HistoryResult[]; personalBest:number; recommendation:number; accumulated:number; weekly:number };
export type SessionEvent = { type:"session"; id:string; date:string; time:string; track:TrackId; exercise:string; sets:number; repsPerSet:number; durationMinutes:number; volume:number; effort:"Leve"|"Normal"|"Forte"; combinedId?:string; isRecord?:boolean };
export type ChallengeEvent = { type:"challenge"; id:string; date:string; title:string };
export type TimelineEvent = SessionEvent | ChallengeEvent;

const definitions:Record<TrackId,{name:string;color:string;exercise:string;reps:number}>={
  push:{name:"Empurrar",color:"var(--track-push)",exercise:"Flexão de braço",reps:14},
  pull:{name:"Puxar",color:"var(--track-pull)",exercise:"Barra fixa",reps:7},
  legs:{name:"Pernas",color:"var(--track-legs)",exercise:"Agachamento",reps:18},
  core:{name:"Core",color:"var(--track-core)",exercise:"Elevação de pernas",reps:10},
};
export const trackIds=Object.keys(definitions) as TrackId[];

const session=(id:string,date:string,time:string,track:TrackId,repsPerSet:number,extra:Partial<SessionEvent>={}):SessionEvent=>({type:"session",id,date,time,track,exercise:definitions[track].exercise,sets:5,repsPerSet,durationMinutes:5,volume:repsPerSet*5,effort:"Normal",...extra});

/** Formats a Date using its local calendar fields (never UTC). */
export function localDateString(value = new Date()) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addLocalDays(date: string, amount: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(year, month - 1, day, 12);
  value.setDate(value.getDate() + amount);
  return localDateString(value);
}

/** Six historical weeks and four planning weeks, ordered as a calendar. */
export function createTimelineDates(today = localDateString()) {
  return Array.from({ length: 71 }, (_, index) => addLocalDays(today, index - 42));
}

export const timelineDates = createTimelineDates();
export const timelineEvents:TimelineEvent[]=[
  session("s01","2026-08-28","07:10","push",10),session("s02","2026-08-29","18:20","legs",14),
  session("s03","2026-08-31","07:30","pull",5,{combinedId:"combo-a"}),session("s04","2026-08-31","07:35","core",8,{combinedId:"combo-a"}),
  session("s05","2026-09-02","06:50","push",11),session("s06","2026-09-02","12:20","push",8),session("s07","2026-09-02","19:15","push",10),
  session("s08","2026-09-04","17:40","legs",15),session("s09","2026-09-05","08:15","core",9),
  session("s10","2026-09-07","07:00","push",12,{combinedId:"combo-b"}),session("s11","2026-09-07","07:08","legs",16,{combinedId:"combo-b"}),session("s12","2026-09-07","07:16","core",9,{combinedId:"combo-b"}),
  session("s13","2026-09-09","18:10","pull",6),session("s14","2026-09-10","06:45","legs",17),
  session("s15","2026-09-12","09:00","push",13),session("s16","2026-09-12","16:00","pull",6),
  session("s17","2026-09-14","07:20","core",10),session("s18","2026-09-15","18:30","legs",18),
  session("s19","2026-09-17","06:55","pull",7,{isRecord:true}),session("s20","2026-09-18","07:05","push",14,{isRecord:true}),
  session("s21","2026-09-20","09:10","legs",19,{combinedId:"combo-c",isRecord:true}),session("s22","2026-09-20","09:18","core",11,{combinedId:"combo-c",isRecord:true}),
  session("s23","2026-09-22","12:00","pull",6),session("s24","2026-09-22","18:00","pull",7),session("s25","2026-09-24","07:10","push",13),
];

export const tracks:Track[]=trackIds.map(id=>{const d=definitions[id];const history=timelineEvents.filter((event):event is SessionEvent=>event.type==="session"&&event.track===id).map(({id,date,exercise,sets,repsPerSet,volume})=>({id,date,exercise,sets,repsPerSet,volume}));return {id,name:d.name,color:d.color,exercise:d.exercise,unit:"repetições",history,personalBest:Math.max(...history.map(h=>h.volume)),recommendation:d.reps,accumulated:history.reduce((n,h)=>n+h.volume,0),weekly:history.slice(-3).reduce((n,h)=>n+h.volume,0)}});
export function prescribedPractice(trackId:TrackId,occurrence=0):Practice{const track=tracks.find(t=>t.id===trackId)!;return{id:`${trackId}-${occurrence}`,track:trackId,capabilities:[trackId],name:track.exercise,unit:"repetições",repsPerSet:track.recommendation,sets:5,durationMinutes:5,totalVolume:track.recommendation*5}}
export const practices=trackIds.map(id=>prescribedPractice(id));
export const evolution=Object.fromEntries(tracks.map(track=>[track.id,track.history.slice(-4).map(item=>({month:new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR",{month:"short"}),value:item.volume,effort:"Moderado"}))])) as Record<TrackId,{month:string;value:number;effort:string}[]>;
