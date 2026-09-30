# Calibre

Aplicação local de treino de calistenia organizada em quatro trilhas permanentes: **Empurrar**, **Puxar**, **Pernas** e **Core**.

## Fluxo

A agenda vertical termina em hoje e aceita várias sessões no mesmo dia. A montagem combina trilhas, 5 ou 10 séries, blocos ou circuito e repetições por série. O cronômetro contabiliza apenas séries cujo minuto terminou completamente.

Ao interromper, o usuário escolhe um motivo e recebe um resumo com séries completas sobre planejadas, percentual, repetições contabilizadas e exercício ativo. Não há pergunta de repetições parciais nem avaliação pós-treino. Sessões interrompidas aparecem no histórico, porém não geram recordes nem referências de progressão. Registros antigos sem contagem de séries exibem o tempo e “Percentual indisponível”.

Volume total é sempre exibido em **repetições**. `addedLoadKg` representa somente carga externa adicional: zero fica oculto e valores positivos aparecem como **Carga adicional: +N kg**. O produto `externalLoadVolume = completedRepetitions * addedLoadKg` é armazenado internamente como “volume de carga externa”; o peso corporal nunca é multiplicado.

## Desenvolvimento

```bash
npm run dev
npm test
npm run lint
npm run build
```

Histórico e preferências são persistidos defensivamente no armazenamento local. Identificadores de motivos e textos de interface são desacoplados em `src/mocks/data.ts`, e a recomendação pura fica em `src/features/workout/recommendationEngine.ts`.
