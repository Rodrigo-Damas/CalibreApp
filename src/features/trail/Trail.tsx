"use client";
import { Check, Dumbbell, Lock, Sparkles } from "lucide-react";
import { useState } from "react";
import { useMockStore } from "@/mocks/store";
import { WorkoutFlow } from "@/features/workout/WorkoutFlow";
export function Trail(){const {stage}=useMockStore();const [training,setTraining]=useState(false);const offsets=["0rem","-3rem","-4rem","-2rem","2.5rem"];
 return <><section className="page trail-page"><div className="hero"><div><p className="eyebrow"><Sparkles/> SUA TRILHA DE TREINOS</p><h1>Uma sessão de<br/>cada vez.</h1><p>Registre seu treino e avance no seu ritmo.</p></div><div className="hero-badge"><strong>{stage}</strong><span>treinos<br/>concluídos</span></div></div>
 <div className="trail-heading"><span>UNIDADE 1</span><h2>Fundação corporal</h2><p>Construa sua base e encontre consistência.</p></div>
 <div className="trail" aria-label="Trilha de treinos">{Array.from({length:7},(_,index)=>{const done=index<stage,active=index===stage;return <div className="stage" style={{"--offset":offsets[index%5]} as React.CSSProperties} key={index}>{active&&<span className="start-label">COMEÇAR</span>}<button className={done?"done":active?"current":"locked"} disabled={!active} onClick={()=>setTraining(true)} aria-label={`Treino ${index+1}, ${done?"concluído":active?"disponível":"bloqueado"}`}>{done?<Check/>:active?<Dumbbell/>:<Lock/>}</button><strong>Treino {index+1}</strong>{index<6&&<i/>}</div>})}</div></section>{training&&<WorkoutFlow onClose={()=>setTraining(false)}/>}</>}
