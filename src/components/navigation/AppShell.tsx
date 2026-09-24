"use client";
import { useState } from "react";
import { Activity, BarChart3, Flame, Map, Menu, UserRound, X } from "lucide-react";
import { useMockStore } from "@/mocks/store";
import { Trail } from "@/features/trail/Trail";
import { Evolution } from "@/features/evolution/Evolution";
import { Onboarding } from "@/features/onboarding/Onboarding";
const destinations=[{id:"journey",label:"Jornada",icon:Map},{id:"evolution",label:"Evolução",icon:BarChart3}] as const;
type Page=typeof destinations[number]["id"];
export function AppShell(){const [page,setPage]=useState<Page>("journey");const [drawer,setDrawer]=useState(false);const [onboarding,setOnboarding]=useState(false);const store=useMockStore();
 return <div className="app-shell"><header className="topbar"><button className="menu-button" onClick={()=>setDrawer(!drawer)} aria-label="Abrir menu">{drawer?<X/>:<Menu/>}</button><div className="brand"><span className="brand-mark"><Activity/></span><span>CALIBRE</span></div><div className="status"><span className="streak"><Flame/> {store.streak} dias</span></div></header>
 <aside className={`sidebar ${drawer?"is-open":""}`}><div className="sidebar-brand"><span className="brand-mark"><Activity/></span><span>CALIBRE</span></div><p className="nav-kicker">SUA EXPERIÊNCIA</p><nav>{destinations.map(({id,label,icon:Icon})=><button key={id} className={page===id?"active":""} onClick={()=>{setPage(id);setDrawer(false)}}><Icon/><span>{label}</span></button>)}</nav><button className="sidebar-profile" onClick={()=>setOnboarding(true)}><span><UserRound/></span><div><strong>Caio</strong><small>Refazer início</small></div></button></aside>
 {drawer&&<button className="backdrop" onClick={()=>setDrawer(false)} aria-label="Fechar menu"/>}<main>{page==="journey"?<Trail/>:<Evolution/>}</main>
 <nav className="bottom-nav">{destinations.map(({id,label,icon:Icon})=><button key={id} className={page===id?"active":""} onClick={()=>setPage(id)}><Icon/><span>{label}</span></button>)}</nav>{onboarding&&<Onboarding onClose={()=>setOnboarding(false)}/>}</div>}
