# Especificação de interface

## Jornada e montagem

A agenda mantém quatro trilhas fixas — Empurrar, Puxar, Pernas e Core — e termina em hoje. A montagem define uma ou mais trilhas, 5 ou 10 séries por exercício, formato em blocos ou circuito e repetições por série. Cada prescrição também possui `addedLoadKg`, sempre entendido como carga externa adicional e nunca como peso corporal. A carga é individual por exercício, começa em zero, não aceita valores negativos e muda em incrementos de 1 kg, independentemente das repetições e da progressão. Remover e selecionar novamente uma trilha restaura repetições e carga aos valores padrão.

O resumo principal apresenta o volume total exclusivamente em repetições. A carga de cada exercício acompanha toda a jornada — montagem, confirmação, execução, conclusão ou interrupção e histórico — no formato **+N kg**, somente quando positiva. Carga zero e volume em quilogramas ficam ocultos nos resumos.

## Execução e interrupção

O cronômetro tem preparação de 10 segundos e cada entrada da sequência dura um minuto. Uma série só é contabilizada depois que seu intervalo termina completamente: interromper durante a nona de dez séries registra 8 de 10 e 80%. Não se pergunta quantas repetições foram feitas na série em curso.

Ao encerrar antecipadamente, a interface pergunta **“Por que o treino terminou antes?”**. Os textos “Não consegui continuar”, “Dor ou desconforto”, “Fiquei sem tempo”, “Fui interrompido” e “Outro motivo” são mapeados, respectivamente, aos identificadores estáveis `could_not_continue`, `pain_or_discomfort`, `time_constraint`, `external_interruption` e `other`.

O resumo da interrupção contém séries completas sobre planejadas, percentual, repetições contabilizadas, exercício ativo, carga adicional quando existir e motivo. A distribuição das séries completas segue a mesma `sequence` usada pelo cronômetro, tanto em blocos quanto em circuito.

## Volume, histórico e progressão

`totalVolume` representa repetições contabilizadas. Internamente, `externalLoadVolume = completedRepetitions * addedLoadKg` é o **volume de carga externa**, reservado para detalhes ou evolução futura. Peso corporal nunca entra nesse cálculo.

Não existe avaliação pós-treino nem regra baseada em RIR. Percepções antigas continuam legíveis apenas para compatibilidade. Recordes e referências de progressão usam somente comparações objetivas entre sessões integralmente concluídas; interrupções permanecem no histórico, mas nunca geram recorde ou referência.

Sessões antigas interrompidas sem contagem suficiente continuam mostrando o tempo e **Percentual indisponível**, sem percentual inferido.
