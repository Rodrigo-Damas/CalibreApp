export type TrackId = "push" | "pull" | "legs" | "core" | "cardio";
export type Effort = "Muito fáceis" | "Fáceis" | "Moderadas" | "Difíceis" | "Muito difíceis" | "Não completei";
export type SuggestionResult = "Fiz" | "Em parte" | "Não fiz";

export type HistoryResult = { id:string; date:string; exercise:string; sets:number; repsPerSet:number; volume:number };
export type Practice = { id:string; track:TrackId; capabilities:TrackId[]; name:string; unit:"repetições"; repsPerSet:number; sets:5; durationMinutes:5; totalVolume:number };
export type Track = { id:TrackId; name:string; color:string; exercise:string; unit:"repetições"; history:HistoryResult[]; personalBest:number; recommendation:number; accumulated:number; weekly:number };

const result=(id:string,date:string,exercise:string,sets:number,repsPerSet:number):HistoryResult=>({id,date,exercise,sets,repsPerSet,volume:sets*repsPerSet});
const history=(id:TrackId,exercise:string,values:number[])=>values.map((volume,index)=>result(`${id}-${index}`,`2026-0${3+index}-1${index}`,exercise,5,Math.round(volume/5)));

export const tracks:Track[]=[
  {id:"push",name:"Empurrar",color:"var(--track-push)",exercise:"Flexão de braço",unit:"repetições",history:history("push","Flexão de braço",[30,40,50,60,70]),personalBest:70,recommendation:14,accumulated:1840,weekly:198},
  {id:"pull",name:"Puxar",color:"var(--track-pull)",exercise:"Barra fixa",unit:"repetições",history:history("pull","Barra fixa",[15,20,25,35]),personalBest:35,recommendation:7,accumulated:920,weekly:96},
  {id:"legs",name:"Pernas",color:"var(--track-legs)",exercise:"Agachamento",unit:"repetições",history:history("legs","Agachamento",[40,55,65,75,90]),personalBest:90,recommendation:18,accumulated:1560,weekly:264},
  {id:"core",name:"Core",color:"var(--track-core)",exercise:"Prancha",unit:"repetições",history:history("core","Prancha",[20,25,30,40]),personalBest:40,recommendation:10,accumulated:780,weekly:112},
  {id:"cardio",name:"Cardio",color:"var(--track-cardio)",exercise:"Pular corda",unit:"repetições",history:history("cardio","Pular corda",[20,30,40]),personalBest:40,recommendation:20,accumulated:460,weekly:80},
];

export function prescribedPractice(trackId:TrackId,occurrence=0):Practice{const track=tracks.find(({id})=>id===trackId)!;const sets=5 as const;return {id:`${trackId}-${occurrence}`,track:trackId,capabilities:[trackId],name:track.exercise,unit:track.unit,repsPerSet:track.recommendation,sets,durationMinutes:5,totalVolume:track.recommendation*sets}}
export const practices=tracks.map(({id})=>prescribedPractice(id));
export const evolution=Object.fromEntries(tracks.map(track=>[track.id,track.history.slice(-4).map(item=>({month:new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR",{month:"short"}),value:item.volume,effort:"Moderado"}))])) as Record<TrackId,{month:string;value:number;effort:string}[]>;
