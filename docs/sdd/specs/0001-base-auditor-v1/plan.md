# Plano: Base Auditor v1

> Referencia: spec.md desta mesma pasta

## Abordagem tecnica

Registrar a implementacao atual como baseline SDD, sem alterar comportamento do app. A v1 permanece organizada entre a entrada `src/main.ts`, a camada de UI em `src/app/`, a extracao em `src/save/extract.ts`, a analise em `src/analysis/analyze.ts`, o worker em `src/worker/analyze.worker.ts` e os dados gerados em `public/game-data.json`.

## Modulos afetados

- Documentacao SDD: descreve o fluxo de trabalho e o estado aprovado da v1.
- Script de guard: valida status das specs antes de deploy.
- Workflow de deploy: roda o guard antes de testes e build.

## Padroes e utilitarios reutilizados

- Fluxo de testes existente: `npm test`.
- Build existente: `npm run build`.
- Arquitetura atual client-side com Vite, Web Worker e Leaflet.

## Riscos e trade-offs

- Esta spec nao corrige lacunas da v1; ela apenas as documenta.
- O guard falha specs `In Progress`, entao trabalhos futuros precisam voltar para `Approved` ou ir para `Done` antes de deploy em `main`.

## Estrategia de verificacao

- `npm run sdd:check`
- `npm test`
- `npm run build`
