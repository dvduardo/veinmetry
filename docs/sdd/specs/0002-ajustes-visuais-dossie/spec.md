# Spec: Ajustes Visuais do Dossie

> Status: Done

## Contexto / Problema

O dossie `docs/dossie-veinmetry.html` definiu uma direcao visual e narrativa mais clara para o Veinmetry: uma ferramenta que leva o jogador do save real ao diagnostico de gargalos, com identidade propria, promessa de privacidade local e duas telas principais. A v1 funcional ja existe, mas a interface real ainda precisa se aproximar do visual, da hierarquia e da linguagem montadas no dossie antes de aprofundar melhorias tecnicas.

## Objetivo

Alinhar a experiencia visual do app ao dossie, cobrindo primeiro a tela de entrada e a tela de relatorio carregado: marca, composicao, copy principal, estados visuais, resumo, mapa, filtros e cards de linhas em um fluxo mais polido e coerente.

## Requisitos funcionais

- [x] Atualizar a tela de entrada para refletir a composicao do dossie: marca no topo, alternancia de tema, subtitulo "Auditor de recursos · Satisfactory", headline "Seu nodulo da conta da fabrica inteira?", texto de apoio e area de upload evidente.
- [x] Manter a mensagem de privacidade local na entrada, deixando claro que o save nao sai do navegador.
- [x] Ajustar o estado de upload para aceitar clique, teclado, drag and drop e feedback visual quando o arquivo estiver sobre a area.
- [x] Atualizar a tela de carregamento para seguir a mesma linguagem visual da marca, comunicando que o app esta seguindo a rede fisica do save.
- [x] Atualizar a tela de relatorio carregado para refletir a direcao do dossie: cabecalho com save/build, acao "Analisar outro save", resumo numerico, mapa, filtros e lista de linhas.
- [x] Exibir no resumo os numeros centrais do dossie: linhas, deficit, no limite e mineradoras.
- [x] Manter filtros visuais para "Todas", "Deficit", "Com folga" e estados equivalentes ja suportados pela v1.
- [x] Preservar os cards de linha com recurso, estado, extracao, demanda, saldo, origens, consumidores, avisos e sugestao quando ja existir dado disponivel.
- [x] Harmonizar os estados visuais de linha com a identidade do dossie: fluxo saudavel, gargalo, recuperacao/folga, escassez ou nao rastreavel.
- [x] Manter o mapa de nodulos usados quando houver coordenadas, com legenda e cores consistentes com os cards.
- [x] Criar `visual-mockups.html` nesta pasta da spec antes de alterar a UI real, usando o dossie como referencia direta.

## Requisitos nao-funcionais

- [x] A UI deve continuar responsiva em mobile e desktop.
- [x] A experiencia deve parecer uma ferramenta em uso, nao uma landing page depois que o relatorio esta carregado.
- [x] Os textos devem caber nos componentes sem sobreposicao em larguras pequenas.
- [x] Componentes interativos devem ser acessiveis por teclado e ter foco visivel.
- [x] A identidade deve usar uma paleta com contraste suficiente nos temas claro e escuro.
- [x] O app continua estatico, sem backend, persistencia remota ou upload do save.
- [x] Os ajustes visuais nao devem alterar o contrato de analise da v1.

## Criterios de aceite

- [x] `visual-mockups.html` representa as duas telas do dossie: entrada e relatorio carregado.
- [x] David aprova o mockup visual antes da implementacao na UI real.
- [x] A tela de entrada real fica visualmente alinhada ao dossie e preserva o fluxo atual de upload.
- [x] A tela de relatorio real fica visualmente alinhada ao dossie e preserva os dados calculados pela v1.
- [x] O usuario consegue identificar rapidamente quantas linhas existem, quantas estao em deficit, quantas estao no limite e quantas mineradoras foram reconhecidas.
- [x] O mapa e os cards usam uma linguagem visual consistente para deficit, folga, limite e nao rastreavel.
- [x] O fluxo continua processando o save somente no navegador.
- [x] `npm run sdd:check` passa enquanto a spec estiver em `Draft` ou depois de aprovada.
- [x] `npm test` passa.
- [x] `npm run build` passa.

## Fora de escopo

- Mudancas no motor de analise, extracao do save ou tipos de dados.
- Novas heuristicas tecnicas de recomendacao.
- Definicao numerica nova para "no limite" alem do que a v1 ja calcula.
- Calculo de trens, caminhoes, drones, fluidos, pocos, tubos ou energia.
- Persistencia de historico de saves ou comparacao entre saves.
- Upload de save, backend, login ou compartilhamento de relatorios.
- Otimizador completo de receitas ou planejamento de fabrica ideal.
- Edicao interativa do grafo da fabrica.

## Perguntas abertas

- Resolvido: a identidade usa wordmark puro com esteira compacta animada como elemento proprietario. A esteira conta uma historia visual sem texto: vazia, fluxo saudavel, gargalo, liberacao, recuperacao, escassez de alimentacao e reinicio do ciclo.
- Resolvido: o wordmark continua textual nesta etapa, com marca simples e refinada inspirada no dossie.
- Resolvido: o mockup pode ajustar copy do dossie para encaixar melhor na tela real, preservando promessa, tom e hierarquia.
