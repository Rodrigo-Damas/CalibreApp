# Calibre Web

Protótipo responsivo do motor de progressão em calistenia do Calibre. A experiência permite navegar por cinco trilhas independentes, montar uma sessão de até cinco práticas, realizar o fluxo de aquecimento e EMOM, registrar a percepção de esforço e visualizar a próxima recomendação adaptada. Todos os dados e estados são simulados e ficam apenas na memória.

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

Percorra **Jornada** e **Evolução**, escolha práticas em uma ou mais trilhas e conclua o ciclo completo. O acesso ao onboarding demonstrativo fica disponível no perfil da navegação lateral. O refresh restaura os mocks iniciais.

## Preview no Vercel

Importe o repositório no Vercel ou use a CLI (`vercel`). O framework e o comando de build são detectados por `vercel.json`. Cada pull request conectado ao Vercel gera um preview. Não são necessárias variáveis de ambiente, credenciais ou identificadores de projeto; não versione a pasta `.vercel`.

Consulte `docs/UI_SPEC.md` e `docs/RESPONSIVE_SPEC.md` para decisões de produto e layout.

## Jornada adaptativa por volume

A Home compara simultaneamente as cinco capacidades permanentes por meio de históricos de esferas, recordes e uma única recomendação futura por trilha. Toque diretamente na próxima esfera para uma prática simples ou use **INICIAR TREINO** para combinar capacidades por toque ou arraste. Participações repetidas são preservadas e intercaladas na prescrição.

O fluxo seguinte confirma exercício básico, volume e ordem, oferece uma sugestão técnica opcional, orienta os blocos concluídos e coleta resultado da sugestão e esforço. A conclusão atualiza em memória histórico, volume semanal/acumulado, recomendação e recorde condicional. Consulte `docs/UI_SPEC.md` para a semântica completa e `docs/RESPONSIVE_SPEC.md` para a matriz de 320 px, mobile, tablet e desktop.
