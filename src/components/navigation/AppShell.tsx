"use client";
import { useState } from "react";
import { Activity, Dumbbell, Flame, Flag, Footprints, Map, Menu, Trophy, X } from "lucide-react";
import { useMockStore } from "@/mocks/store";
import { Trail } from "@/features/trail/Trail";
import { ExerciseLibrary } from "@/features/exercises/ExerciseLibrary";
import { Journey } from "@/features/journey/Journey";
import { Mission } from "@/features/mission/Mission";
const destinations=[{id:"trail",label:"Trilha",icon:Map},{id:"exercises",label:"Exercícios",icon:Dumbbell},{id:"journey",label:"Jornada",icon:Trophy},{id:"mission",label:"Missão",icon:Flag}] as const;
type Page=typeof destinations[number]["id"];
export function AppShell(){const [page,setPage]=useState<Page>("trail");const [drawer,setDrawer]=useState(false);const store=useMockStore();const screen={trail:<Trail/>,exercises:<ExerciseLibrary/>,journey:<Journey/>,mission:<Mission/>}[page];
 return <div className="app-shell">
  <header className="topbar"><button className="menu-button" onClick={()=>setDrawer(!drawer)} aria-label="Abrir menu">{drawer?<X/>:<Menu/>}</button><div className="brand"><span className="brand-mark"><Activity/></span><span>CALIBRE</span></div><div className="status"><span className="streak"><Flame/> {store.streak}</span><span className="xp"><Footprints/> {store.xp} XP</span></div></header>
  <aside className={`sidebar ${drawer?"is-open":""}`}><div className="sidebar-brand"><span className="brand-mark"><Activity/></span><span>CALIBRE</span></div><p className="nav-kicker">SEU TREINO</p><nav aria-label="Navegação principal">{destinations.map(({id,label,icon:Icon})=><button key={id} className={page===id?"active":""} onClick={()=>{setPage(id);setDrawer(false)}}><Icon/><span>{label}</span></button>)}</nav><div className="sidebar-profile"><span>CM</span><div><strong>Calibre Member</strong><small>Nível {Math.floor(store.xp/250)+1}</small></div></div></aside>
  {drawer&&<button className="backdrop" onClick={()=>setDrawer(false)} aria-label="Fechar menu"/>}
  <main id="main-content">{screen}</main>
  <nav className="bottom-nav" aria-label="Navegação principal">{destinations.map(({id,label,icon:Icon})=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}><Icon/><span>{label}</span></button>)}</nav>
 </div>}
