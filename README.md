# Calibre

Aplicação local de treino de calistenia organizada em quatro trilhas permanentes: **Empurrar** (Flexão no solo), **Puxar** (Barra fixa), **Pernas** (Agachamento livre) e **Core** (Abdominal no solo).

## Fluxo

A jornada é uma timeline vertical que termina em hoje, sem dias futuros. O CTA **Treinar** abre a seleção de uma a quatro trilhas, condição pré-sessão, duração, formato quando aplicável e revisão editável. Curto usa 5 séries; Longo usa 10 e `ceil(recomendação curta / 2)` repetições por série. Volume é sempre identificado como **estimado**.

Sessões múltiplas no mesmo dia e prescrições independentes em Blocos ou Circuito são suportadas. A execução tem contagem inicial, sinais automáticos e nenhuma confirmação entre séries. O encerramento Pulso registra uma entre cinco percepções; interrupções guardam tempo, mas não presumem volume.

## Desenvolvimento

```bash
npm run dev
npm test
npm run lint
npm run build
```

Histórico e preferências são persistidos defensivamente no armazenamento local. A recomendação pura fica em `src/features/workout/recommendationEngine.ts`.
