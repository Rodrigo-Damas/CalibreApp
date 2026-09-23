# Calibre Web

Aplicação Next.js que traduz o protótipo SwiftUI preservado em `CalibreCompleto.swift` para uma experiência web responsiva. Todos os dados e estados são simulados e ficam apenas na memória.

## Executar

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — servidor local com hot reload.
- `npm run build` — build de produção.
- `npm run lint` — validação ESLint.
- `npm test` — testes Vitest.

## Validar responsividade

Abra as ferramentas de desenvolvimento do navegador e teste, no mínimo:

- celular: 375 × 812;
- tablet: 768 × 1024 (confira o drawer lateral);
- desktop: 1440 × 900 (confira a sidebar persistente).

Percorra as quatro áreas, inicie o treino atual, selecione exercícios, altere séries e conclua para conferir resumo e mapa muscular. O refresh deve restaurar os mocks iniciais.

## Preview no Vercel

Importe o repositório no Vercel ou use a CLI (`vercel`). O framework e o comando de build são detectados por `vercel.json`. Cada pull request conectado ao Vercel gera um preview. Não são necessárias variáveis de ambiente, credenciais ou identificadores de projeto; não versione a pasta `.vercel`.

Consulte `docs/UI_SPEC.md` e `docs/RESPONSIVE_SPEC.md` para decisões de produto e layout.
