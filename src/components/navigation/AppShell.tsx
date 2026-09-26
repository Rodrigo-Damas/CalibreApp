"use client";

import { useState } from "react";
import { CalendarDays, ChartNoAxesColumnIncreasing, UserRound } from "lucide-react";
import { Evolution } from "@/features/evolution/Evolution";
import { Profile } from "@/features/profile/Profile";
import { Trail } from "@/features/trail/Trail";
import { useMockStore } from "@/mocks/store";

type View = "journey" | "evolution" | "profile";
const items = [
  { id: "journey" as const, label: "Agenda", Icon: CalendarDays },
  { id: "evolution" as const, label: "Evolução", Icon: ChartNoAxesColumnIncreasing },
  { id: "profile" as const, label: "Perfil", Icon: UserRound },
];

export function AppShell() {
  const store = useMockStore();
  const [view, setView] = useState<View>("journey");
  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><div><strong>CALIBRE</strong><small>PLANO DE TREINO</small></div></div>
      <div className="header-actions"><span className="streak"><small>SEQUÊNCIA</small><b>{store.streak} dias</b></span><button aria-label="Abrir perfil" onClick={() => setView("profile")}>Perfil</button></div>
    </header>
    <main>{view === "journey" ? <Trail /> : view === "evolution" ? <Evolution /> : <Profile />}</main>
    <nav className="bottom-nav" aria-label="Navegação principal">{items.map(({ id, label, Icon }) => <button key={id} className={view === id ? "active" : ""} aria-current={view === id ? "page" : undefined} onClick={() => setView(id)}><Icon aria-hidden="true" /><span>{label}</span></button>)}</nav>
  </div>;
}
