export const trackIds = ["push", "pull", "legs", "core"] as const;
export type TrackId = (typeof trackIds)[number];
export type DurationChoice = "short" | "long";
export type WorkoutFormat = "blocks" | "circuit";
export type Arrival = "empty" | "slow" | "normal" | "ready" | "whole";
export type Perception = "limit" | "heavy" | "right" | "light" | "spare";
export type SessionStatus = "completed" | "interrupted";
export type TrackDefinition = { id:TrackId; name:string; color:string; exercise:string; exerciseKey:"floor-push-up"|"pull-up"|"air-squat"|"floor-crunch"; initialShortRecommendation:number };
export const tracks:TrackDefinition[] = [
{id:"push",name:"Empurrar",color:"var(--track-push)",exercise:"Flexão no solo",exerciseKey:"floor-push-up",initialShortRecommendation:14},
{id:"pull",name:"Puxar",color:"var(--track-pull)",exercise:"Barra fixa",exerciseKey:"pull-up",initialShortRecommendation:7},
{id:"legs",name:"Pernas",color:"var(--track-legs)",exercise:"Agachamento livre",exerciseKey:"air-squat",initialShortRecommendation:18},
{id:"core",name:"Core",color:"var(--track-core)",exercise:"Abdominal no solo",exerciseKey:"floor-crunch",initialShortRecommendation:10},
];
export type SessionPrescription={track:TrackId;exerciseKey:TrackDefinition["exerciseKey"];suggestedShortReps:number;chosenShortReps:number;displayedReps:number;sets:5|10;estimatedVolume?:number};
export type WorkoutSession={id:string;combinedId:string;date:string;time:string;duration:DurationChoice;format:WorkoutFormat;arrival:Arrival;plannedMinutes:number;elapsedSeconds:number;status:SessionStatus;perception?:Perception;prescriptions:SessionPrescription[]};
export function localDateString(value=new Date()){const y=value.getFullYear(),m=String(value.getMonth()+1).padStart(2,"0"),d=String(value.getDate()).padStart(2,"0");return `${y}-${m}-${d}`}
export function addLocalDays(date:string,amount:number){const[y,m,d]=date.split("-").map(Number),v=new Date(y,m-1,d,12);v.setDate(v.getDate()+amount);return localDateString(v)}
/** A historical calendar ending in today; future days are never rendered. */
export function createTimelineDates(today=localDateString(),historyDays=42){return Array.from({length:historyDays+1},(_,i)=>addLocalDays(today,i-historyDays))}
export const timelineDates=createTimelineDates();
const demo=(id:string,offset:number,track:TrackId,reps:number,perception:Perception="right"):WorkoutSession=>{const t=tracks.find(x=>x.id===track)!;return{id,combinedId:id,date:addLocalDays(localDateString(),offset),time:"07:10",duration:"short",format:"blocks",arrival:"normal",plannedMinutes:5,elapsedSeconds:300,status:"completed",perception,prescriptions:[{track,exerciseKey:t.exerciseKey,suggestedShortReps:reps,chosenShortReps:reps,displayedReps:reps,sets:5,estimatedVolume:reps*5}]}};
export const demoSessions:WorkoutSession[]=[demo("s1",-28,"push",11),demo("s2",-25,"legs",16,"heavy"),demo("s3",-22,"pull",6),demo("s4",-19,"core",9,"light"),demo("s5",-15,"push",13),demo("s6",-11,"legs",18),demo("s7",-8,"pull",7),demo("s8",-5,"core",10),demo("s9",-2,"push",14)];
export type SessionEvent=WorkoutSession;export const timelineEvents=demoSessions;
