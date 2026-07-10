# Plano: Ajustes Visuais do Dossie

> Referencia: spec.md desta mesma pasta

## Abordagem tecnica

Primeiro sera criado e validado `visual-mockups.html` com as duas telas-alvo: entrada e relatorio carregado. Depois da validacao, a UI real sera ajustada em camadas pequenas: tokens visuais, wordmark com esteira compacta animada, layout da entrada, loading, cabecalho do relatorio, resumo, mapa, filtros e cards.

A implementacao deve preservar o fluxo atual de analise client-side. O contrato de `AnalysisResult` e os calculos da v1 nao serao alterados; a mudanca deve consumir os dados existentes e melhorar composicao, hierarquia, estados visuais e responsividade.

## Modulos afetados

- `docs/sdd/specs/0002-ajustes-visuais-dossie/visual-mockups.html` - mockup visual aprovado antes da UI real.
- `src/app/views.ts` - markup das telas de entrada, loading, erro e relatorio.
- `src/app/styles.css` - tokens, layout responsivo, foco, estados de upload, wordmark/esteira, resumo, mapa, filtros e cards.
- `src/app/app.ts` - animacao da esteira compacta, seletores necessarios ao novo markup, mantendo upload, teclado, drag and drop, filtros e tema.
- `src/app/map.ts` - apenas ajustes de classes/legenda se necessario para alinhar marcadores ao novo visual.

## Padroes e utilitarios reutilizados

- `landingView`, `loadingView`, `reportView` e `errorView` continuam sendo a fronteira de renderizacao.
- `escapeHtml`, `number` e `statusText` continuam centralizando formatacao segura e labels de estado.
- O controle atual de tema via `data-theme` e `localStorage` sera mantido.
- O fluxo de upload existente, com input escondido, dropzone focavel e eventos de drag/drop, sera reaproveitado.
- O mapa Leaflet existente e as classes de status das linhas (`deficit`, `balanced`, `surplus`, `untraceable`) continuam como base visual e funcional.
- A simulacao da esteira aprovada no mockup de identidade sera reaproveitada no app real: itens individuais, colisao, gargalo na saida, liberacao, recuperacao e escassez de alimentacao.

## Riscos e trade-offs

- O dossie tem uma linguagem mais editorial; a tela de relatorio precisa continuar parecendo ferramenta de uso recorrente, com densidade suficiente para auditoria.
- A esteira compacta animada deve reforcar identidade sem roubar espaco, especialmente no mobile e no relatorio.
- Os cards podem ficar altos se a hierarquia visual exagerar margens e tipografia; a implementacao deve manter leitura rapida.
- A paleta deve herdar a identidade do dossie sem ficar dependente de um unico verde acido.
- O mapa real depende de Leaflet e tiles externos; os ajustes devem preservar area estavel, legenda e marcadores mesmo quando o tile demora.

## Estrategia de verificacao

- Validar manualmente `visual-mockups.html` em desktop e largura mobile antes da UI real.
- Depois da implementacao, testar manualmente entrada, tema, foco por teclado, clique no dropzone, drag/drop, loading, filtros e retorno para nova analise.
- Rodar `npm run sdd:check`.
- Rodar `npm test`.
- Rodar `npm run build`.
- Subir `npm run dev` para validacao visual local em desktop e mobile.
- Fechar a spec somente apos David aprovar visualmente a UI real rodando localmente.
