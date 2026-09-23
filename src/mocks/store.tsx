"use client";
import { createContext, useContext, useMemo, useState } from "react";
import { scenarios, type Scenario } from "./data";
type RecordItem={id:string;stage:number;date:string;sets:number;xp:number;details?:Record<string,number>};
type Store={stage:number;xp:number;streak:number;records:RecordItem[];finish:(details:Record<string,number>)=>RecordItem};
const Context=createContext<Store|null>(null);
export function MockStoreProvider({children,scenario="filled"}:{children:React.ReactNode;scenario?:Scenario}){
 const seed=scenarios[scenario]; const [records,setRecords]=useState<RecordItem[]>(seed.records); const [stage,setStage]=useState(seed.stage); const [xp,setXp]=useState(seed.xp);
 const value=useMemo<Store>(()=>({stage,xp,streak:seed.streak,records,finish(details){const sets=Object.values(details).reduce((a,b)=>a+b,0);const item={id:`session-${stage}`,stage,date:"Hoje",sets,xp:50+Object.keys(details).length*10,details};setRecords(v=>[...v,item]);setStage(v=>v+1);setXp(v=>v+item.xp);return item;}}),[stage,xp,records,seed.streak]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMockStore(){const value=useContext(Context);if(!value)throw new Error("MockStoreProvider ausente");return value;}
