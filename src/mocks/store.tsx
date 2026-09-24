"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { prescribedPractice, tracks, type Effort, type Practice, type SuggestionResult, type Track, type TrackId } from "./data";

export type CompletedPractice = {
  practice: Practice;
  effort: Effort;
  completedVolume: number;
  previousVolume: number;
  nextVolume: number;
  suggestionOffered: boolean;
  suggestionAccepted: boolean;
  suggestionText?: string;
  suggestionVolume?: number;
  suggestionResult?: SuggestionResult;
};
type Store = {xp:number;streak:number;completed:number;minutes:number;repetitions:number;session:Practice[];lastSession:CompletedPractice[];journeys:Track[];addTrack:(id:TrackId)=>void;add:(p:Practice)=>void;remove:(index:number)=>void;clear:()=>void;adapt:(p:Practice,e:Effort,details?:Partial<CompletedPractice>)=>CompletedPractice;finishSession:(results:CompletedPractice[])=>void};
const Context=createContext<Store|null>(null);

export function adaptedVolume(volume:number,effort:Effort,suggestionResult?:SuggestionResult){
  const factor:Record<Effort,number>={"Muito fáceis":1.15,"Fáceis":1.1,"Moderadas":1.05,"Difíceis":1,"Muito difíceis":.9,"Não completei":.8};
  const suggestionAdjustment=suggestionResult==="Não fiz"?.95:suggestionResult==="Em parte"?.98:1;
  return Math.max(1,Math.round(volume*factor[effort]*suggestionAdjustment));
}
export const adaptedDose=adaptedVolume;

export function MockStoreProvider({children}:{children:React.ReactNode}){
  const [session,setSession]=useState<Practice[]>([]);
  const [lastSession,setLastSession]=useState<CompletedPractice[]>([]);
  const [journeys,setJourneys]=useState<Track[]>(tracks);
  const [completed,setCompleted]=useState(24);
  const [repetitions,setRepetitions]=useState(5560);
  const value=useMemo<Store>(()=>({xp:2840,streak:7,completed,minutes:0,repetitions,session,lastSession,journeys,
    addTrack(id){setSession(items=>[...items,prescribedPractice(id,items.filter(item=>item.track===id).length)])},
    add(p){setSession(items=>[...items,{...p,id:`${p.track}-${items.length}`}])},
    remove(index){setSession(items=>items.filter((_,itemIndex)=>itemIndex!==index))},clear(){setSession([])},
    adapt(p,effort,details={}){const completedVolume=details.completedVolume??p.volume;return {practice:p,effort,completedVolume,previousVolume:p.volume,nextVolume:adaptedVolume(p.volume,effort,details.suggestionResult),suggestionOffered:Boolean(p.suggestion),suggestionAccepted:false,...details}},
    finishSession(results){setLastSession(results);setCompleted(value=>value+results.length);setRepetitions(value=>value+results.reduce((sum,result)=>sum+result.completedVolume,0));setJourneys(current=>current.map(track=>{const related=results.filter(result=>result.practice.track===track.id);if(!related.length)return track;const volumes=related.map(result=>result.completedVolume);const added=volumes.reduce((sum,volume)=>sum+volume,0);return {...track,history:[...track.history,...volumes],personalBest:Math.max(track.personalBest,...volumes),recommendation:related.at(-1)!.nextVolume,accumulated:track.accumulated+added,weekly:track.weekly+added}}));setSession([])}
  }),[completed,repetitions,session,lastSession,journeys]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMockStore(){const value=useContext(Context);if(!value)throw new Error("MockStoreProvider ausente");return value}
export const defaultPractice=prescribedPractice("push");
