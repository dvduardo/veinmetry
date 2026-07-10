import type { AnalysisResult, ConsumerBalance, LineBalance, SourceBalance } from '../types'

interface DemoSource {
  miner: string
  mk: string
  clock: number
  purity: SourceBalance['purity']
  rate: number
  x: number
  y: number
}

interface DemoConsumer {
  machine: string
  recipeName: string
  clock: number
  demand: number
}

interface DemoLine {
  id: string
  item: string
  itemName: string
  status: LineBalance['status']
  merged: boolean
  sources: DemoSource[]
  consumers: DemoConsumer[]
  suggestion?: string
  warnings?: string[]
}

const demoLines: DemoLine[] = [
  {
    id: 'demo-copper',
    item: 'Desc_OreCopper_C',
    itemName: 'Copper Ore',
    status: 'deficit',
    merged: true,
    sources: [
      { miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Normal', rate: 120, x: -32_000, y: 152_000 },
      { miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Normal', rate: 120, x: 9_500, y: 161_000 },
    ],
    consumers: [
      { machine: 'Smelter', recipeName: 'Copper Ingot', clock: 1, demand: 240 },
      { machine: 'Constructor', recipeName: 'Wire', clock: 1, demand: 90 },
    ],
    suggestion: 'Suba o clock das mineradoras para 138% ou conecte o nódulo puro a oeste da base.',
  },
  {
    id: 'demo-iron',
    item: 'Desc_OreIron_C',
    itemName: 'Iron Ore',
    status: 'surplus',
    merged: true,
    sources: [
      { miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Pure', rate: 240, x: -108_000, y: 118_000 },
      { miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Pure', rate: 240, x: -96_500, y: 131_500 },
    ],
    consumers: [{ machine: 'Smelter', recipeName: 'Iron Ingot', clock: 1, demand: 300 }],
  },
  {
    id: 'demo-limestone',
    item: 'Desc_Stone_C',
    itemName: 'Limestone',
    status: 'balanced',
    merged: false,
    sources: [{ miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Pure', rate: 240, x: 152_000, y: 78_000 }],
    consumers: [{ machine: 'Constructor', recipeName: 'Concrete', clock: 1, demand: 240 }],
    suggestion: 'Qualquer máquina extra vai gerar déficit; considere um segundo nódulo.',
  },
  {
    id: 'demo-coal',
    item: 'Desc_Coal_C',
    itemName: 'Coal',
    status: 'surplus',
    merged: true,
    sources: [
      { miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Normal', rate: 120, x: 205_000, y: -12_000 },
      { miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Normal', rate: 120, x: 214_500, y: -4_500 },
      { miner: 'Miner Mk2', mk: 'Mk2', clock: 1.5, purity: 'RP_Normal', rate: 180, x: 226_000, y: -21_000 },
    ],
    consumers: [{ machine: 'Coal Generator', recipeName: 'Energia', clock: 1, demand: 315 }],
  },
  {
    id: 'demo-caterium',
    item: 'Desc_OreGold_C',
    itemName: 'Caterium Ore',
    status: 'untraceable',
    merged: false,
    sources: [
      { miner: 'Miner Mk1', mk: 'Mk1', clock: 1, purity: 'RP_Normal', rate: 60, x: 289_000, y: 96_000 },
      { miner: 'Miner Mk1', mk: 'Mk1', clock: 1, purity: 'RP_Normal', rate: 60, x: 297_500, y: 104_000 },
    ],
    consumers: [],
    warnings: ['A linha atravessa um Industrial Storage; consumidores após o armazém não são rastreáveis na v1.'],
  },
  {
    id: 'demo-quartz',
    item: 'Desc_RawQuartz_C',
    itemName: 'Raw Quartz',
    status: 'deficit',
    merged: false,
    sources: [{ miner: 'Miner Mk2', mk: 'Mk2', clock: 0.5, purity: 'RP_Pure', rate: 120, x: 65_000, y: -38_000 }],
    consumers: [{ machine: 'Constructor', recipeName: 'Quartz Crystal', clock: 1, demand: 150 }],
    suggestion: 'A mineradora está a 50%; subir para 63% zera o déficit sem novo nódulo.',
  },
  {
    id: 'demo-bauxite',
    item: 'Desc_OreBauxite_C',
    itemName: 'Bauxite',
    status: 'surplus',
    merged: false,
    sources: [{ miner: 'Miner Mk2', mk: 'Mk2', clock: 1, purity: 'RP_Normal', rate: 120, x: -215_000, y: -95_000 }],
    consumers: [{ machine: 'Refinery', recipeName: 'Alumina Solution', clock: 1, demand: 60 }],
  },
]

function toLine(demo: DemoLine): LineBalance {
  const sources: SourceBalance[] = demo.sources.map((source, index) => ({
    id: `${demo.id}-source-${index}`,
    miner: source.miner,
    mk: source.mk,
    clock: source.clock,
    node: `${demo.id}-node-${index}`,
    x: source.x,
    y: source.y,
    z: 0,
    item: demo.item,
    itemName: demo.itemName,
    purity: source.purity,
    theoreticalRate: source.rate,
    effectiveRate: source.rate,
  }))
  const consumers: ConsumerBalance[] = demo.consumers.map((consumer, index) => ({
    id: `${demo.id}-consumer-${index}`,
    machine: consumer.machine,
    recipe: consumer.recipeName,
    recipeName: consumer.recipeName,
    item: demo.item,
    clock: consumer.clock,
    demand: consumer.demand,
  }))
  const extraction = sources.reduce((total, source) => total + source.effectiveRate, 0)
  const demand = consumers.reduce((total, consumer) => total + consumer.demand, 0)
  return {
    id: demo.id,
    item: demo.item,
    itemName: demo.itemName,
    sources,
    consumers,
    extraction,
    demand,
    balance: extraction - demand,
    merged: demo.merged,
    traceable: demo.status !== 'untraceable',
    warnings: demo.warnings ?? [],
    suggestion: demo.suggestion,
    status: demo.status,
  }
}

export function demoResult(): AnalysisResult {
  const lines = demoLines.map(toLine)
  const miners = lines.reduce((total, line) => total + line.sources.length, 0)
  return {
    saveName: 'FABRICA_EXEMPLO',
    buildVersion: 372858,
    generatedAt: new Date().toISOString(),
    stats: {
      objects: 4210,
      miners,
      machines: 57,
      belts: 312,
      connections: 618,
      lines: lines.length,
      untraceable: lines.filter((line) => line.status === 'untraceable').length,
    },
    lines,
    warnings: ['Você está vendo um save de exemplo; arraste o seu .sav na tela inicial para auditar a sua fábrica.'],
  }
}
