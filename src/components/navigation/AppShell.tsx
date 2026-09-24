"use client";
import { Activity, Flame } from "lucide-react";
import { useMockStore } from "@/mocks/store";
import { Trail } from "@/features/trail/Trail";

export function AppShell(){const store=useMockStore();return <div className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark"><Activity/></span><span>CALIBRE</span></div><span className="streak"><Flame/> {store.streak} dias</span></header><main><Trail/></main></div>}
