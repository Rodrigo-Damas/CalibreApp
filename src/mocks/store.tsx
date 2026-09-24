"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { prescribedPractice, tracks, type Effort, type Practice, type SuggestionResult, type Track, type TrackId } from "./data";

export type CompletedPractice = {practice:Practice;effort:Effort;completedVolume:number;previousVolume:number;nextVolume:number;suggestionOffered:boolean;suggestionAccepted:boolean;suggestionText?:string;suggestionVolume?:number;suggestionResult?:SuggestionResult};
export const sessionDuration=(session:Practice[])=>session.reduce((sum,item)=>sum+item.durationMinutes,0);
export const volumeByTrack=(session:Practice[])=>Object.fromEntries(session.map(item=>[item.track,item.repsPerSet*item.sets])) as Partial<Record<TrackId,number>>;
export const sessionVolume=(session:Practice[])=>session.reduce((sum,item)=>sum+item.repsPerSet*item.sets,0);
export const sessionSets=(session:Practice[])=>session.reduce((sum,item)=>sum+item.sets,0);
export const practiceOrder=(session:Practice[])=>session.map(item=>item.track);

type Store={xp:number;streak:number;completed:number;minutes:number;repetitions:number;session:Practice[];lastSession:CompletedPractice[];journeys:Track[];addTrack:(id:TrackId)=>void;add:(p:Practice)=>void;remove:(index:number)=>void;clear:()=>void;reorder:()=>void;adapt:(p:Practice,e:Effort,details?:Partial<CompletedPractice>)=>CompletedPractice;finishSession:(results:CompletedPractice[])=>void};
const Context=createContext<Store|null>(null);
export function adaptedVolume(volume:number,effort:Effort,suggestionResult?:SuggestionResult){const factor:Record<Effort,number>={"Muito fáceis":1.15,"Fáceis":1.1,"Moderadas":1.05,"Difíceis":1,"Muito difíceis":.9,"Não completei":.8};const adjustment=suggestionResult==="Não fiz"?.95:suggestionResult==="Em parte"?.98:1;return Math.max(1,Math.round(volume*factor[effort]*adjustment))}
export const adaptedDose=adaptedVolume;

export function MockStoreProvider({children}:{children:React.ReactNode}){
  const [session,setSession]=useState<Practice[]>([]);const [lastSession,setLastSession]=useState<CompletedPractice[]>([]);const [journeys,setJourneys]=useState<Track[]>(tracks);const [completed,setCompleted]=useState(24);const [repetitions,setRepetitions]=useState(5560);
  const value=useMemo<Store>(()=>({xp:2840,streak:7,completed,minutes:0,repetitions,session,lastSession,journeys,
    addTrack(id){setSession(items=>items.length>=2||items.some(item=>item.track===id)?items:[...items,prescribedPractice(id)])},
    add(p){setSession(items=>items.length>=2||items.some(item=>item.track===p.track)?items:[...items,{...p,id:`${p.track}-${items.length}`}])},
    remove(index){setSession(items=>items.filter((_,i)=>i!==index))},clear(){setSession([])},reorder(){setSession(items=>items.length===2?[items[1],items[0]]:items)},
    adapt(p,effort,details={}){const completedVolume=details.completedVolume??p.totalVolume;return {practice:p,effort,completedVolume,previousVolume:p.totalVolume,nextVolume:adaptedVolume(p.totalVolume,effort,details.suggestionResult),suggestionOffered:false,suggestionAccepted:false,...details}},
    finishSession(results){setLastSession(results);setCompleted(v=>v+results.length);setRepetitions(v=>v+results.reduce((sum,r)=>sum+r.completedVolume,0));setJourneys(current=>current.map(track=>{const related=results.filter(r=>r.practice.track===track.id);if(!related.length)return track;const values=related.map(r=>r.completedVolume);const added=values.reduce((a,b)=>a+b,0);const newHistory=related.map((r,index)=>({id:`${r.practice.id}-${Date.now()}-${index}`,date:new Date().toISOString().slice(0,10),exercise:r.practice.name,sets:r.practice.sets,repsPerSet:r.practice.repsPerSet,volume:r.completedVolume}));return {...track,history:[...track.history,...newHistory],personalBest:Math.max(track.personalBest,...values),accumulated:track.accumulated+added,weekly:track.weekly+added}}));setSession([])}
  }),[completed,repetitions,session,lastSession,journeys]);return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useMockStore(){const value=useContext(Context);if(!value)throw new Error("MockStoreProvider ausente");return value}
export const defaultPractice=prescribedPractice("push");
