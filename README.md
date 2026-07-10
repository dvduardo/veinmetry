# Nódulo

Auditor client-side de linhas de recursos do Satisfactory. O usuário solta um `.sav`; o app monta o grafo físico de esteiras e compara a extração das mineradoras com a demanda das máquinas conectadas.

O arquivo fica no navegador. Não existe backend nem upload do save.

## Desenvolvimento

Requer Node.js 22+.

```bash
npm install
npm run data:generate
npm run dev
```

Depois, abra a URL exibida pelo Vite e use um save do Satisfactory 1.1.

## Verificação

```bash
npm test
npm run build
```

Os testes cobrem splitter, merger de duas origens e gargalo na esteira de saída. Para validar contra um save real, confira primeiro a contagem de mineradoras e depois uma linha conhecida no jogo.

## Dados do jogo

`public/game-data.json` é gerado por `scripts/generate-game-data.mjs` a partir dos dados de receitas do Satisfactory Tools e do mapa de nódulos do SCIM. Para uma geração totalmente offline, informe arquivos locais:

```bash
SATISFACTORY_TOOLS_DATA=/caminho/data.json \
SATISFACTORY_MAP_DATA=/caminho/map.json \
npm run data:generate
```

## Escopo da v1

- Mineradoras Mk.1–Mk.3, esteiras/lifts Mk.1–Mk.6, splitters, mergers e containers.
- Demanda configurada pela receita e pelo clock da máquina.
- Origens agrupadas quando linhas se unem.
- Trens, caminhões, drones, fluidos, poços e sushi belts ficam fora do balanço.

O menor tier de esteira exibido no card é informativo. O limitador aplicado ao cálculo de extração é a esteira ligada diretamente à saída de cada mineradora; calcular cortes de capacidade arbitrários em uma malha inteira fica para uma evolução do motor.
