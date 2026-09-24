"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { practices, type Effort, type Practice } from "./data";

export type CompletedPractice={practice:Practice;effort:Effort;previousDose:number;nextDose:number};
type Store={xp:number;streak:number;completed:number;minutes:number;repetitions:number;session:Practice[];lastSession:CompletedPractice[];add:(p:Practice)=>void;remove:(index:number)=>void;clear:()=>void;adapt:(p:Practice,e:Effort)=>CompletedPractice;finishSession:(results:CompletedPractice[])=>number};
const Context=createContext<Store|null>(null);
export function adaptedDose(dose:number,effort:Effort){const factor:Record<Effort,number>={"Muito fáceis":1.2,"Fáceis":1.1,"Moderadas":1.05,"Difíceis":1,"Muito difíceis":.9,"Não completei":.75};return Math.max(1,Math.round(dose*factor[effort]));}
export function MockStoreProvider({children}:{children:React.ReactNode}){const [xp,setXp]=useState(2840);const [session,setSession]=useState<Practice[]>([]);const [lastSession,setLastSession]=useState<CompletedPractice[]>([]);const [completed,setCompleted]=useState(100);const [minutes,setMinutes]=useState(2400);const [repetitions,setRepetitions]=useState(12800);
 const value=useMemo<Store>(()=>({xp,streak:7,completed,minutes,repetitions,session,lastSession,add(p){setSession(v=>v.length<5?[...v,p]:v)},remove(i){setSession(v=>v.filter((_,index)=>index!==i))},clear(){setSession([])},adapt(p,e){return{practice:p,effort:e,previousDose:p.dose,nextDose:adaptedDose(p.dose,e)}},finishSession(results){const gain=40+results.length*25;setXp(v=>v+gain);setCompleted(v=>v+results.length);setMinutes(v=>v+results.length*5);setRepetitions(v=>v+results.reduce((sum,r)=>sum+r.previousDose*5,0));setLastSession(results);setSession([]);return gain;}}),[xp,completed,minutes,repetitions,session,lastSession]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMockStore(){const value=useContext(Context);if(!value)throw new Error("MockStoreProvider ausente");return value;}
export const defaultPractice=practices[1];
