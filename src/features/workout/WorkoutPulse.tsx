"use client";

import { useState } from "react";
import type { Perception } from "@/mocks/data";

const choices: [Perception, string][] = [["limit", "No limite"], ["heavy", "Pesado"], ["right", "Na medida"], ["light", "Leve"], ["spare", "Sobrou"]];

export function WorkoutPulse({ onConfirm }: { onConfirm: (perception: Perception) => void }) {
  const [selected, setSelected] = useState<Perception | null>(null);
  function choose(perception: Perception) {
    setSelected(perception);
    if ("vibrate" in navigator) navigator.vibrate(15);
  }
  return <section className="pulse builder-step">
    <h2>Como foi o treino?</h2>
    <div className="pulse-control" role="radiogroup" aria-label="Como foi o treino">
      {choices.map(([id, label]) => <button key={id} role="radio" aria-checked={selected === id} onClick={() => choose(id)}><i aria-hidden="true" /><span>{label}</span></button>)}
    </div>
    <button className="primary-button pulse-finish" disabled={!selected} onClick={() => selected && onConfirm(selected)}>Salvar treino</button>
  </section>;
}
