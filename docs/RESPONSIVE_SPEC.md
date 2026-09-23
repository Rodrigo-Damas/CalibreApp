# Especificação responsiva

## Mobile — 320–767 px

- Cabeçalho compacto e navegação inferior fixa com quatro destinos.
- Conteúdo em coluna única; cards e CTA usam a largura disponível.
- Trilha serpenteia com deslocamentos menores, sem rolagem horizontal.
- Modal de treino ocupa toda a viewport e mantém a ação principal fixa no rodapé.

## Tablet — 768–1023 px

- Navegação inferior vira menu lateral temporário (drawer), aberto pelo botão no cabeçalho.
- Grades passam a duas colunas quando há largura útil.
- Fundo escurecido fecha o drawer; navegação e conteúdo não competem pelo espaço.

## Desktop — a partir de 1024 px

- Barra lateral persistente de 272 px, com perfil no rodapé.
- Cabeçalho e conteúdo respeitam o deslocamento lateral.
- Conteúdo limitado a 1184 px; cards usam duas colunas e a trilha permanece centralizada.

## Larguras de validação

Validar em **375 × 812**, **768 × 1024** e **1440 × 900**. Conferir ausência de overflow horizontal, troca correta de navegação, legibilidade, foco por teclado, rodapé do treino e conclusão simulada.
