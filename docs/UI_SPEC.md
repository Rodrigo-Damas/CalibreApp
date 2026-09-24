# Especificação de interface — Calibre

## Jornada histórica

A Home apresenta simultaneamente **Empurrar, Puxar, Pernas, Core e Cardio**. Cada caminho é uma sequência curta: esferas preenchidas e conexões sólidas são práticas realizadas; a esfera com troféu é o recorde; a conexão pontilhada leva à única esfera vazia, a recomendação atual. O comprimento de cada histórico torna o desenvolvimento relativo reconhecível antes dos números. Volume semanal e acumulado substituem XP e tempo como sinais principais.

As cores são identidades semânticas (`--track-push`, `--track-pull`, `--track-legs`, `--track-core` e `--track-cardio`). Uma prática possui uma lista de capacidades, permitindo que uma esfera híbrida use futuramente gradiente ou divisão de cores. O estado opcional `goal` existe no modelo, mas não cria controles incompletos.

## Composição por conexão

`INICIAR TREINO` abre a montagem. O usuário pode tocar nas recomendações ou arrastar uma até outra; ambas as entradas produzem a mesma seleção acessível. Destinos sugeridos recebem halo e o texto “Combinação sugerida”. A ligação pontilhada comunica sugestão, enquanto seleção e borda sólida comunicam confirmação. A teia só ganha ênfase nessa etapa.

Os controles `+` e `−` repetem uma capacidade e mostram `2×`, `3×` sem duplicar a trilha. Cada ocorrência permanece na fila. A prescrição intercala capacidades quando possível e determina exercício básico, volume e ordem; combinações não pontuam nesta versão.

## Prática e feedback

Antes de cada prática, exercício e volume continuam visíveis enquanto a sugestão técnica aparece como camada opcional. Há somente “Aceitar sugestão” e “Manter prática padrão”. Ao aceitar, registra-se `Fiz`, `Em parte` ou `Não fiz` antes da avaliação principal de seis esforços.

A execução é orientada por volume: capacidade, exercício, prescrito, concluído, blocos e próxima prática. A capacidade atual colore ambiente e progresso sem substituir os rótulos textuais. O motor em memória pode elevar, manter ou reduzir a recomendação. A conclusão preenche as próximas esferas, solidifica conexões, soma volumes e só altera o recorde quando ele é superado.

## Estado e acessibilidade

`MockStoreProvider` mantém tudo em memória; recarregar restaura os mocks. Não há autenticação, banco ou algoritmo definitivo. Controles têm nomes acessíveis, `aria-pressed`, foco visível e alvos mínimos de 44 px. O toque oferece alternativa integral ao arraste, e `prefers-reduced-motion` desativa a celebração animada.
