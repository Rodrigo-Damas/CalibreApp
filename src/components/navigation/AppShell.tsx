"use client";

import { Activity, ChartNoAxesColumnIncreasing, Flame, Map, UserRound } from "lucide-react";
import { useState } from "react";
import { Evolution } from "@/features/evolution/Evolution";
import { Profile } from "@/features/profile/Profile";
import { Trail } from "@/features/trail/Trail";
import { useMockStore } from "@/mocks/store";

type View = "journey" | "evolution" | "profile";
const items = [
  { id: "journey" as const, label: "Jornada", Icon: Map },
  { id: "evolution" as const, label: "Evolução", Icon: ChartNoAxesColumnIncreasing },
  { id: "profile" as const, label: "Perfil", Icon: UserRound },
];

export function AppShell() {
  const store = useMockStore();
  const [view, setView] = useState<View>("journey");
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Activity aria-hidden="true" /></span><div><strong>CALIBRE</strong><small>CALISTENIA</small></div></div>
      <div className="header-actions"><span className="streak"><Flame aria-hidden="true" /> <b>{store.streak}</b><small> dias</small></span><button aria-label="Abrir perfil" onClick={() => setView("profile")}><UserRound aria-hidden="true" /></button></div>
    </header>
    <main>{view === "journey" ? <Trail /> : view === "evolution" ? <Evolution /> : <Profile />}</main>
    <nav className="bottom-nav" aria-label="Navegação principal">{items.map(({ id, label, Icon }) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}><Icon aria-hidden="true" /><span>{label}</span></button>)}</nav>
  </div>;
}
