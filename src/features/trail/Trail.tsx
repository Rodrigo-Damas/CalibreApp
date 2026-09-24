"use client";
import { Check, Play, Trophy } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { type Track } from "@/mocks/data";
import { sessionDuration, useMockStore } from "@/mocks/store";
import { WorkoutFlow } from "@/features/workout/WorkoutFlow";

function JourneyTrack({track,selected,unavailable,onToggle}:{track:Track;selected:boolean;unavailable:boolean;onToggle:()=>void}){
  return <article className="journey-column" style={{"--track":track.color} as CSSProperties} data-track={track.id}>
    <header><span aria-hidden="true">{track.icon}</span><h2>{track.name}</h2></header>
    <div className="node-path" aria-label={`Histórico de ${track.name}`}>
      {track.history.map((value,index)=><div className="history-step" key={`${value}-${index}`}>
        <button type="button" className={`journey-node history-node ${value===track.personalBest?"record":""}`} aria-label={value===track.personalBest?`Recorde de ${track.name}: ${value} repetições`:`Prática realizada: ${value} repetições`}><span>{value===track.personalBest?<Trophy aria-hidden="true"/>:value}</span></button>
        <i className="journey-line" aria-hidden="true"/>
      </div>)}
      <button type="button" className={`journey-node suggestion-node ${selected?"selected":""}`} disabled={unavailable} aria-pressed={selected} aria-label={`${selected?"Remover":"Selecionar"} sugestão de ${track.name}: ${track.recommendation} repetições por série`} onClick={onToggle}>
        {selected&&<Check className="selection-check" aria-hidden="true"/>}<strong>{track.recommendation}</strong><small>por série</small>
      </button>
      <span className="suggestion-caption">SUGESTÃO</span>
    </div>
  </article>
}

export function Trail(){
  const store=useMockStore();const [training,setTraining]=useState(false);
  function toggle(track:Track){const index=store.session.findIndex(item=>item.track===track.id);if(index>=0)store.remove(index);else store.addTrack(track.id)}
  return <><section className="journey-page"><div className="journey-title"><span>CALIBRE</span><h1>Sua jornada</h1></div>
    <div className="journeys-scroll"><div className="journeys-grid">{store.journeys.map(track=><JourneyTrack key={track.id} track={track} selected={store.session.some(item=>item.track===track.id)} unavailable={store.session.length===2&&!store.session.some(item=>item.track===track.id)} onToggle={()=>toggle(track)}/>)}</div></div>
  </section>
  {store.session.length>0&&<div className="start-training-dock"><div><span>{store.session.length} {store.session.length===1?"TRILHA":"TRILHAS"}</span><strong>{sessionDuration(store.session)} min</strong></div><button className="primary-button" onClick={()=>setTraining(true)}>INICIAR <Play aria-hidden="true"/></button></div>}
  {training&&<WorkoutFlow onClose={()=>setTraining(false)}/>}</>
}
