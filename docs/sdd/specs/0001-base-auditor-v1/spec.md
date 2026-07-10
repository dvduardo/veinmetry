# Spec: Base Auditor v1

> Status: Done - documenta a v1 existente antes de novas features

## Contexto / Problema

O Veinmetry ja possui uma primeira versao funcional do auditor de linhas de recursos do Satisfactory. Antes de iniciar novas features, o projeto precisa registrar esse estado como baseline SDD para evitar que melhorias futuras alterem escopo, privacidade ou criterios de validacao sem decisao explicita.

## Objetivo

Documentar a v1 atual como base aprovada: upload local de `.sav`, extracao client-side, analise em worker, relatorio de linhas de recursos e mapa de pontos de recurso usados.

## Requisitos funcionais

- [x] Permitir que o usuario selecione ou arraste um arquivo `.sav`.
- [x] Processar o save somente no navegador, sem backend e sem upload do arquivo.
- [x] Carregar `public/game-data.json` com dados de receitas, mineradoras, esteiras e pontos de recurso.
- [x] Extrair mineradoras, maquinas, esteiras/lifts, splitters, mergers, containers e conexoes reconhecidas.
- [x] Calcular extracao, demanda, saldo e status por linha rastreavel.
- [x] Agrupar linhas quando multiplas mineradoras entram na mesma malha.
- [x] Limitar a extracao efetiva pela esteira ligada diretamente a saida da mineradora.
- [x] Mostrar avisos quando uma linha mistura materiais, tem origem desconhecida ou termina sem consumidor reconhecido.
- [x] Renderizar mapa Leaflet com pins dos pontos de recurso usados quando houver coordenadas.

## Requisitos nao-funcionais

- [x] O arquivo `.sav` permanece local ao navegador.
- [x] A analise roda em Web Worker para nao travar a interface principal.
- [x] O app continua sendo estatico, servido por Vite/GitHub Pages.
- [x] A verificacao automatizada cobre unidade e build TypeScript/Vite.

## Criterios de aceite

- [x] Um `.sav` valido inicia o fluxo de progresso e retorna relatorio ou erro claro.
- [x] Saves sem mineradoras conectadas geram aviso em vez de falha silenciosa.
- [x] Testes unitarios cobrem splitter, merger de duas origens e gargalo na esteira de saida.
- [x] `npm test` passa.
- [x] `npm run build` passa.

## Fora de escopo

- Backend, upload de save ou persistencia remota.
- Trens, caminhoes, drones, fluidos, pocos e sushi belts.
- Calculo de cortes arbitrarios de capacidade em uma malha inteira.
- Novas features de UX alem do que ja existe na v1.

## Perguntas abertas

Nenhuma para esta spec-base. Ela registra o estado atual do projeto antes dos proximos ciclos SDD.
