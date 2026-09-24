"use client";
import { ArrowRight, Grip, Link2, Minus, Plus, Sparkles, Trophy, X } from "lucide-react";
import { useState, type CSSProperties, type DragEvent } from "react";
import { tracks, type Track, type TrackId } from "@/mocks/data";
import { useMockStore } from "@/mocks/store";
import { WorkoutFlow } from "@/features/workout/WorkoutFlow";

const compact=(value:number)=>value>=1000?`${(value/1000).toFixed(1).replace(".0","")}k`:String(value);

function JourneyTrack({track,quantity,composing,source,onInspect,onAdd,onRemove,onDragStart,onDrop}:{track:Track;quantity:number;composing:boolean;source:TrackId|null;onInspect:(text:string)=>void;onAdd:()=>void;onRemove:()=>void;onDragStart:()=>void;onDrop:()=>void}){
  const suggested=source?tracks.find(item=>item.id===source)?.suggestedWith.includes(track.id):false;
  const max=Math.max(...track.history);
  return <article className={`capacity-journey ${composing?"is-composing":""} ${suggested?"is-suggested":""} ${quantity?"is-selected":""}`} style={{"--track":track.color} as CSSProperties} data-track={track.id}>
    <header><span className="capacity-symbol">{track.icon}</span><div><h2>{track.name}</h2><small>{compact(track.accumulated)} acumuladas · {track.weekly} esta semana</small></div>{suggested&&<span className="suggestion-label">Combinação sugerida</span>}</header>
    <div className="node-path" aria-label={`Histórico de ${track.name}`}>
      {track.history.map((volume,index)=><div className="history-step" key={`${volume}-${index}`}><button className={`journey-node filled ${volume===max?"record":""}`} onClick={()=>volume===max&&onInspect(`Recorde · ${volume} ${track.unit}`)} aria-label={volume===max?`Recorde de ${track.name}: ${volume} ${track.unit}`:`Prática realizada: ${volume} ${track.unit}`}><span>{volume===max?<Trophy/>:""}</span></button>{index<track.history.length-1&&<i className="journey-line solid"/>}</div>)}
      <i className="journey-line dotted"/>
      <div className="next-wrap"><button className="journey-node next" draggable={composing} onDragStart={event=>{event.dataTransfer.setData("text/plain",track.id);onDragStart()}} onDragOver={(event)=>event.preventDefault()} onDrop={(event:DragEvent)=>{event.preventDefault();onDrop()}} onClick={onAdd} aria-pressed={quantity>0} aria-label={`${quantity?"Adicionar outra participação de":"Iniciar"} ${track.name}, recomendação de ${track.recommendation} ${track.unit}`}><Grip/><strong>{track.recommendation}</strong></button>{quantity>0&&<div className="quantity-control" aria-label={`Participações de ${track.name}`}><button onClick={onRemove} aria-label={`Diminuir ${track.name}`}><Minus/></button><b>{quantity}×</b><button onClick={onAdd} aria-label={`Aumentar ${track.name}`}><Plus/></button></div>}</div>
    </div>
  </article>
}

export function Trail(){
  const store=useMockStore();const [composing,setComposing]=useState(false);const [training,setTraining]=useState(false);const [source,setSource]=useState<TrackId|null>(null);const [notice,setNotice]=useState("Toque em uma esfera para ver seus detalhes.");
  const count=(id:TrackId)=>store.session.filter(item=>item.track===id).length;
  function add(id:TrackId){store.addTrack(id);setSource(id);setNotice(`${tracks.find(track=>track.id===id)!.name} adicionada à sessão.`);if(!composing)setTraining(true)}
  function remove(id:TrackId){const index=store.session.map(item=>item.track).lastIndexOf(id);if(index>=0)store.remove(index)}
  function beginComposition(){store.clear();setComposing(true);setSource(null);setNotice("Escolha por toque ou arraste uma esfera até outra.")}
  return <><section className={`page journey-page constellation ${source?"has-source":""}`}>
    <div className="journey-intro"><div><p className="eyebrow"><Sparkles/> SUA JORNADA</p><h1>O que você construiu.<br/><span>O próximo passo.</span></h1><p>Cada esfera é uma prática. O Calibre recomenda; você escolhe o caminho.</p></div><aside><strong>{store.journeys.reduce((sum,track)=>sum+track.weekly,0)}</strong><span>volume desta semana</span></aside></div>
    <div className="journey-legend" aria-label="Legenda"><span><i className="legend-filled"/>Realizada</span><span><i className="legend-record"/>Recorde</span><span><i className="legend-next"/>Recomendação</span></div>
    {composing&&<div className="composition-banner"><Link2/><div><strong>Monte sua sessão</strong><span>Toque para conectar. Use + para repetir uma capacidade.</span></div><button onClick={()=>{store.clear();setComposing(false)}} aria-label="Sair da composição"><X/></button></div>}
    <div className="journeys-grid">{store.journeys.map(track=><JourneyTrack key={track.id} track={track} quantity={count(track.id)} composing={composing} source={source} onInspect={setNotice} onAdd={()=>add(track.id)} onRemove={()=>remove(track.id)} onDragStart={()=>{if(!count(track.id))store.addTrack(track.id);setSource(track.id)}} onDrop={()=>{if(source&&source!==track.id){if(!count(track.id))store.addTrack(track.id);setNotice(`${tracks.find(item=>item.id===source)!.name} conectada a ${track.name}.`)}}}/>)}</div>
    <p className="journey-notice" role="status">{notice}</p>
  </section>
  <div className="start-training-dock">{composing&&store.session.length>0&&<div><span>SUA SESSÃO</span><strong>{store.session.map(item=>tracks.find(track=>track.id===item.track)!.name).join(" · ")}</strong></div>}<button className="primary-button" onClick={()=>composing&&store.session.length?setTraining(true):beginComposition()}>{composing&&store.session.length?"ORGANIZAR SESSÃO":"INICIAR TREINO"}<ArrowRight/></button></div>
  {training&&<WorkoutFlow onClose={()=>{setTraining(false);setComposing(false)}}/>}</>
}
