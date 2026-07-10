# Spec: Painel de Detalhe ao Lado do Mapa

> Status: Done

## Contexto / Problema

Hoje, ao clicar num marcador de nodulo no mapa de recursos, a pagina inteira rola ate o card correspondente na lista de linhas. Em saves grandes, com muitas linhas, esse scroll leva o usuario para o meio de uma lista longa: ele perde o mapa de vista, perde a nocao de onde estava e a experiencia fica descasada — o mapa e essencial, mas a interacao com ele joga o usuario para longe dele.

## Objetivo

Ao clicar num nodulo no mapa, os detalhes completos daquela linha aparecem imediatamente num painel fixo ao lado do mapa, sem nenhum scroll de pagina e com o mapa sempre visivel.

## Requisitos funcionais

- [x] O painel de detalhe fica ao lado do mapa e esta sempre presente, com um estado vazio orientando: clicar num nodulo mostra os detalhes ali.
- [x] Clicar num marcador renderiza no painel o mesmo card de linha usado na lista (recurso, estado, extracao, demanda, saldo, origens, consumidores, sugestao e avisos), sem duplicar markup.
- [x] Clicar em outro marcador troca o conteudo do painel para a nova linha.
- [x] O painel tem botao de fechar que limpa a selecao e volta ao estado vazio.
- [x] O painel oferece a acao secundaria "Ver na lista", que rola ate o card correspondente na lista completa (o comportamento atual vira opt-in).
- [x] O marcador selecionado ganha destaque visual no mapa; a selecao anterior perde o destaque.
- [x] O card correspondente na lista mantem o destaque de selecao ja existente, mas sem scroll automatico.
- [x] Se o card for maior que a altura do mapa, o painel rola internamente, sem mover a pagina.
- [x] Em telas estreitas (mobile), o painel empilha abaixo do mapa com altura maxima propria.
- [x] A lista completa de linhas abaixo do mapa permanece intacta, com filtros funcionando como hoje.

## Requisitos nao-funcionais

- [x] Sem dependencias novas; apenas Leaflet, TS e CSS ja usados.
- [x] O save continua processado somente no navegador.
- [x] O painel anuncia mudancas para leitores de tela (`aria-live`) e o botao de fechar e focavel por teclado.
- [x] A largura util do mapa em desktop nao pode ficar inutilizavel; o painel tem largura fixa razoavel.
- [x] Funciona nos temas claro e escuro com a paleta atual.

## Criterios de aceite

- [x] `visual-mockups.html` nesta pasta mostra o painel em tres estados: vazio, com linha selecionada (desktop) e variante mobile empilhada.
- [x] David aprova o mockup visual antes da implementacao na UI real.
- [x] Clicar num marcador mostra o card no painel sem nenhum scroll da pagina.
- [x] Fechar o painel limpa selecao no mapa e na lista.
- [x] "Ver na lista" rola suavemente ate o card na lista completa.
- [x] Card longo rola dentro do painel com o mapa parado.
- [x] Em viewport menor que 650px o painel aparece abaixo do mapa.
- [x] `npm run sdd:check`, `npm test` e `npm run build` passam.
- [x] David valida visualmente no `npm run dev` antes de a spec ir para `Done`.

## Fora de escopo

- Virtualizacao ou paginacao da lista de linhas.
- Filtrar a lista a partir do clique no mapa.
- Mudancas no motor de analise, extracao do save ou tipos de dados.
- Sincronizacao inversa (clicar no card da lista destacar/centralizar o mapa).
- Mudancas nos filtros por status existentes.

## Perguntas abertas

Nenhuma — decisoes de UX (painel lateral sempre presente, scroll antigo como acao secundaria, destaque duplo mapa+lista) ja foram tomadas por David na conversa de 2026-07-10.
