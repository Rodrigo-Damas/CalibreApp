export type TrackId = "push" | "pull" | "legs" | "core" | "cardio";
export type Effort = "Muito fáceis" | "Fáceis" | "Moderadas" | "Difíceis" | "Muito difíceis" | "Não completei";
export type SuggestionResult = "Fiz" | "Em parte" | "Não fiz";

export type Practice = {
  id: string;
  track: TrackId;
  capabilities: TrackId[];
  name: string;
  unit: "repetições";
  repsPerSet: number;
  sets: 5;
  durationMinutes: 5;
  totalVolume: number;
};

export type Track = {
  id: TrackId;
  name: string;
  icon: string;
  color: string;
  exercise: string;
  unit: "repetições";
  history: number[];
  personalBest: number;
  recommendation: number;
  accumulated: number;
  weekly: number;
};

export const tracks: Track[] = [
  {id:"push",name:"Empurrar",icon:"↗",color:"var(--track-push)",exercise:"Flexão de braço no solo",unit:"repetições",history:[32,42,50,58,64,72,80],personalBest:80,recommendation:14,accumulated:1840,weekly:198},
  {id:"pull",name:"Puxar",icon:"↓",color:"var(--track-pull)",exercise:"Barra fixa",unit:"repetições",history:[18,24,28,34],personalBest:34,recommendation:7,accumulated:920,weekly:96},
  {id:"legs",name:"Pernas",icon:"◇",color:"var(--track-legs)",exercise:"Agachamento",unit:"repetições",history:[40,55,66,74,82,90],personalBest:90,recommendation:8,accumulated:1560,weekly:264},
  {id:"core",name:"Core",icon:"✦",color:"var(--track-core)",exercise:"Abdominais",unit:"repetições",history:[20,28,34,40],personalBest:40,recommendation:10,accumulated:780,weekly:112},
  {id:"cardio",name:"Cardio",icon:"≈",color:"var(--track-cardio)",exercise:"Pular corda",unit:"repetições",history:[20,30,38],personalBest:38,recommendation:20,accumulated:460,weekly:80},
];

export function prescribedPractice(trackId: TrackId, occurrence = 0): Practice {
  const track = tracks.find(({id}) => id === trackId)!;
  const sets = 5 as const;
  return {id:`${trackId}-${occurrence}`,track:trackId,capabilities:[trackId],name:track.exercise,unit:track.unit,repsPerSet:track.recommendation,sets,durationMinutes:5,totalVolume:track.recommendation*sets};
}

export const practices = tracks.map(({id}) => prescribedPractice(id));
export const evolution = Object.fromEntries(tracks.map(track => [track.id, track.history.slice(-4).map((value,index) => ({month:["Abr","Mai","Jun","Jul"][index],value,effort:"Moderado"}))])) as Record<TrackId,{month:string;value:number;effort:string}[]>;
