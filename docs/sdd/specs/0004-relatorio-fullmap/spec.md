# Spec: Relatorio Full-Map como Tela Padrao

> Status: Approved
> Spec e plano aprovados por David em 2026-07-10. Implementacao validada visualmente por David em 2026-07-10; aguardando PR para fechar como Done.

## Contexto / Problema

Hoje o relatorio pos-analise vive num container centralizado de 1040px: o mapa fica pequeno, dividido com um painel lateral fixo de 360px que permanece vazio ate o usuario clicar num nodulo, e as laterais da pagina ficam sem uso em telas largas. David nao gosta desse layout: o mapa e a peca central do produto, mas ocupa uma fracao da tela e a pagina parece "espremida".

Alem disso, hoje um visitante so descobre o que a ferramenta faz depois de conseguir um `.sav` e envia-lo — nao ha como "ver antes de usar".

## Objetivo

Apos a analise do `.sav`, o usuario cai direto numa tela de relatorio onde o mapa ocupa a viewport inteira, com resumo na topbar, filtros sobre o mapa, painel de lista de linhas acionavel e detalhe da linha em drawer — direto ao ponto, sem scroll de pagina. A landing ganha um modo demonstracao: um botao que abre essa mesma tela com um save de exemplo embutido, para o visitante explorar a ferramenta antes de enviar o proprio save.

## Requisitos funcionais

- [x] A landing e a tela de loading permanecem como sao hoje, com uma unica adicao na landing: um botao/link secundario "Ver demonstracao" (abaixo da dropzone), que abre o relatorio full-map com dados de exemplo, sem exigir arquivo.
- [x] O modo demonstracao usa um `AnalysisResult` de exemplo embutido no bundle (linhas realistas cobrindo os quatro status: deficit, no limite, com folga e nao rastreavel, com nodulos em coordenadas reais do mapa) e passa pelo mesmo `renderReport` do fluxo normal — nenhuma tela paralela.
- [x] No modo demonstracao, a tela deixa claro que os dados sao de exemplo (ex.: chip/pilula "Dados de exemplo" na topbar) e oferece o caminho para analisar o proprio save ("Analisar meu save" volta para a landing).
- [x] Ao fim da analise, a tela de relatorio renderiza o mapa ocupando toda a area util da viewport (sem container de 1040px e sem scroll de pagina).
- [x] A topbar do relatorio contem: a marca Veinmetry **com a animacao da esteira intacta** (`brandMarkup()` + `startBrandBeltAnimations`), nome do save + build, resumo em chips (linhas, deficit, no limite, mineradoras), botao "Analisar outro save" e o toggle de tema.
- [x] Sobre o mapa, no topo, ficam: botao "☰ Linhas N" que abre/fecha o painel de lista, os filtros por status (Todas / Deficit / No limite / Com folga / Nao rastreaveis) e a legenda.
- [x] Os filtros esmaecem no mapa os marcadores fora do status selecionado e escondem os cards correspondentes no painel de lista.
- [x] O painel esquerdo "Linhas" lista todas as linhas em cards compactos (inclusive linhas sem coordenadas); clicar num card enquadra os nodulos da linha no mapa (quando existem) e abre o drawer de detalhe.
- [x] Clicar num marcador abre o drawer direito com o card completo da linha (mesmo `lineCardView` de hoje, sem duplicar markup); os marcadores da linha ganham destaque `is-selected`.
- [x] O drawer tem botao de fechar; `Esc` fecha primeiro o drawer, depois o painel de lista.
- [x] Avisos globais (ex.: save com mods) aparecem como pilula compacta flutuando na base do mapa.
- [x] Save sem nenhum nodulo mapeavel: a tela mantem o layout, mostra o painel de lista ja aberto e uma mensagem no lugar do mapa em vez de tiles.
- [x] "Analisar outro save" e o clique na marca voltam para a landing, como hoje.

## Requisitos nao-funcionais

- [x] Sem dependencias novas; apenas Leaflet, TS e CSS ja usados.
- [x] O save continua processado somente no navegador.
- [x] Painel e drawer anunciam mudancas (`aria-live`), botoes de fechar focaveis por teclado; drawer/painel funcionam como overlays em telas estreitas.
- [x] Funciona nos temas claro e escuro com a paleta atual.
- [x] `map.invalidateSize()` garantido quando o mapa e criado na tela cheia (evita tiles cortados).
- [x] A animacao da esteira da marca nao sofre nenhuma alteracao de comportamento ou estilo.

## Criterios de aceite

- [x] `visual-mockups.html` nesta pasta mostra o fluxo landing → loading → relatorio full-map (aprovado por David em 2026-07-10; unica ressalva ja incorporada: a marca deve usar o logo animado real, nao texto simples).
- [x] Apos carregar um `.sav` real, o mapa aparece ocupando a viewport inteira, sem scroll de pagina.
- [x] Clicar num marcador abre o drawer com o card completo; `Esc` ou ✕ fecham e limpam o destaque.
- [x] "☰ Linhas" abre o painel com todas as linhas; clicar num card enquadra os nodulos e abre o detalhe.
- [x] Filtros esmaecem marcadores e filtram os cards do painel de forma consistente.
- [x] A esteira animada aparece funcionando na topbar do relatorio.
- [x] Save sem nodulos mapeaveis mostra a lista aberta e mensagem apropriada.
- [x] Na landing, "Ver demonstracao" abre o relatorio full-map com os dados de exemplo, identificado como demonstracao, e "Analisar meu save" volta para a landing.
- [x] `npm run sdd:check`, `npm test` e `npm run build` passam.
- [x] David valida visualmente no `npm run dev` antes de a spec ir para `Done`.

## Fora de escopo

- Mudancas na landing, loading, tela de erro ou na animacao da esteira.
- Mudancas no motor de analise, worker, extracao do save ou tipos de dados.
- Busca/ordenacao no painel de linhas.
- Persistir estado de filtros/paineis entre analises.
- Embutir um `.sav` real e roda-lo pelo worker para gerar a demonstracao (a demo e um `AnalysisResult` estatico; mais leve e deterministico).
- Modo "relatorio em documento" como alternativa (o full-map substitui o layout atual).

## Perguntas abertas

Nenhuma — direcao (full-map como padrao), lista atras do botao ☰ e demais decisoes de UX foram tomadas por David na conversa de 2026-07-10 sobre o mockup `docs/mockups/mockup-relatorio-fullmap.html`.
