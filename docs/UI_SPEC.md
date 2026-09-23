# Especificação de interface — Calibre

## Fonte da análise

A referência visual e funcional é `CalibreCompleto.swift`, preservada sem alterações. O protótipo SwiftUI define uma experiência de treino gamificada, clara e arredondada, com verde como cor de ação, fundo quase branco e feedbacks em amarelo, laranja e azul.

## Princípios

1. **Uma ação por vez:** a trilha destaca apenas o próximo treino disponível.
2. **Progresso legível:** XP, sequência, nível e conclusão têm texto além de cor.
3. **Registro sem julgamento:** descanso não penaliza e nenhum dado é persistido.
4. **Mapa responsável:** o mapa muscular é ilustrativo, nunca uma medição clínica.

## Arquitetura

- **Trilha:** unidades, etapas concluídas, etapa atual e etapas bloqueadas.
- **Exercícios:** busca local por nome ou grupo e catálogo determinístico.
- **Jornada:** XP, nível, conquistas e histórico da sessão corrente.
- **Missão:** desafios diário/semanal e calendário de consistência.
- **Treino:** seleção, contador de séries, conclusão, resumo e mapa muscular.

## Linguagem visual

- Superfícies brancas sobre canvas verde-neutro; cartões com borda sutil.
- Tipografia arredondada, títulos pesados e etiquetas em caixa alta.
- Cantos de 10–22 px, espaços na escala de 4 px e elevação discreta.
- Verde para seleção/ação; laranja/amarelo para sequência e conquistas; azul para XP.
- Estados: foco com halo, hover com deslocamento sutil, pressionado com redução de elevação, desabilitado com opacidade de 48%.

## Comportamentos

O estado reside no provider React e reinicia ao recarregar. Concluir treino adiciona um registro em memória, avança uma etapa e mostra resumo. Não há autenticação, API, banco, câmera, Vision, persistência, contagem automática nem regra real de XP.

## Acessibilidade

Controles possuem nome acessível, ícones não são a única forma de comunicar estado, foco é visível, áreas de toque são amplas, contraste é preservado e `prefers-reduced-motion` é respeitado.
