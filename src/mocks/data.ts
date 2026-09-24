export type TrackId = "push" | "pull" | "legs" | "core" | "cardio";
export type Effort = "Muito fáceis" | "Fáceis" | "Moderadas" | "Difíceis" | "Muito difíceis" | "Não completei";
export type SuggestionResult = "Fiz" | "Em parte" | "Não fiz";
export type JourneyNodeState = "history" | "record" | "next" | "goal";

export type Practice = {
  id: string;
  track: TrackId;
  capabilities: TrackId[];
  name: string;
  volume: number;
  unit: "repetições" | "segundos";
  blocks: number;
  suggestion?: { text: string; volume: number };
};

export type Track = {
  id: TrackId;
  name: string;
  icon: string;
  color: string;
  exercise: string;
  unit: "repetições" | "segundos";
  history: number[];
  personalBest: number;
  recommendation: number;
  accumulated: number;
  weekly: number;
  suggestion?: { text: string; volume: number };
  suggestedWith: TrackId[];
};

export const tracks: Track[] = [
  {id:"push",name:"Empurrar",icon:"↗",color:"var(--track-push)",exercise:"Flexão de braço",unit:"repetições",history:[32,42,50,58,64,72,80],personalBest:80,recommendation:70,accumulated:1840,weekly:198,suggestion:{text:"Realize as primeiras 10 como flexão diamante.",volume:10},suggestedWith:["pull","core"]},
  {id:"pull",name:"Puxar",icon:"↓",color:"var(--track-pull)",exercise:"Remada australiana",unit:"repetições",history:[18,24,28,34],personalBest:34,recommendation:36,accumulated:920,weekly:96,suggestion:{text:"Pause um segundo junto à barra nas primeiras 6.",volume:6},suggestedWith:["push"]},
  {id:"legs",name:"Pernas",icon:"◇",color:"var(--track-legs)",exercise:"Agachamento",unit:"repetições",history:[40,55,66,74,82,90],personalBest:90,recommendation:92,accumulated:1560,weekly:264,suggestion:{text:"Faça as primeiras 12 com pausa no fundo.",volume:12},suggestedWith:["core","cardio"]},
  {id:"core",name:"Core",icon:"✦",color:"var(--track-core)",exercise:"Crunch controlado",unit:"repetições",history:[20,28,34,40],personalBest:40,recommendation:42,accumulated:780,weekly:112,suggestion:{text:"Segure dois segundos no topo das primeiras 8.",volume:8},suggestedWith:["legs","push"]},
  {id:"cardio",name:"Cardio",icon:"≈",color:"var(--track-cardio)",exercise:"Polichinelo",unit:"repetições",history:[20,30,38],personalBest:38,recommendation:40,accumulated:460,weekly:80,suggestion:{text:"Alterne a base nos primeiros 10 saltos.",volume:10},suggestedWith:["legs"]},
];

export function prescribedPractice(trackId: TrackId, occurrence = 0): Practice {
  const track = tracks.find(({id}) => id === trackId)!;
  return {id:`${trackId}-${occurrence}`,track:trackId,capabilities:[trackId],name:track.exercise,volume:track.recommendation,unit:track.unit,blocks:4,suggestion:track.suggestion};
}

export const practices = tracks.map(({id}) => prescribedPractice(id));

export const evolution = Object.fromEntries(tracks.map(track => [track.id, track.history.slice(-4).map((value,index) => ({month:["Abr","Mai","Jun","Jul"][index],value,effort:"Moderado"}))])) as Record<TrackId,{month:string;value:number;effort:string}[]>;
