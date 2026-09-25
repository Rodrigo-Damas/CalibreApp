# Especificação responsiva

- **320–379 px:** timeline mantém quatro colunas identificadas, com rolagem quando necessária; controles usam área mínima de 44 px; escolhas de duração e formato empilham.
- **Mobile:** cabeçalho das trilhas fica fixo e a navegação ocupa a safe area inferior. A timeline abre em hoje e permite rolar somente para o passado.
- **Tablet e desktop:** navegação passa para a lateral, topbar permanece fixa e a área principal respeita largura máxima de leitura.
- **Todas as larguras:** revisão conserva valores por trilha; a sequência detalhada é secundária; execução mostra apenas trilha, exercício, repetições, minuto, relógio e comando.
- `prefers-reduced-motion` remove transições e animações não essenciais. Foco visível, contraste, rótulos textuais, estados vazios e estado de hidratação não dependem de cor.
