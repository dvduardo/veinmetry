import type {
  AnalysisResult,
  ConsumerBalance,
  ExtractedBuilding,
  ExtractedConnection,
  GameData,
  LineBalance,
  Purity,
  SaveSnapshot,
  SourceBalance,
} from '../types'
import { UnionFind } from './union-find'

const purityMultiplier: Record<Purity, number> = {
  RP_Inpure: 0.5,
  RP_Normal: 1,
  RP_Pure: 2,
  unknown: 1,
}

const purityLabel: Record<Purity, string> = {
  RP_Inpure: 'impuro',
  RP_Normal: 'normal',
  RP_Pure: 'puro',
  unknown: 'pureza desconhecida',
}

function classToken(path: string | undefined): string | undefined {
  return path?.split('.').at(-1)
}

function mkOf(className: string): string {
  return className.match(/Mk(\d)/i)?.[1] ? `Mk${className.match(/Mk(\d)/i)![1]}` : 'Mk1'
}

function beltRate(building: ExtractedBuilding, data: GameData): number | undefined {
  if (!/Conveyor(Belt|Lift)Mk/i.test(building.className)) return undefined
  return data.beltRates[mkOf(building.className)]
}

function itemName(item: string, data: GameData): string {
  return data.items[item]?.name ?? item.replace(/^Desc_/, '').replace(/_C$/, '')
}

function machineName(className: string): string {
  return className
    .replace(/^Build_/, '')
    .replace(/Mk(\d)/, ' Mk.$1')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
}

function recipeRate(amount: number, duration: number, clock: number): number {
  return amount * 60 / duration * clock
}

function outputBeltCapacity(
  source: ExtractedBuilding,
  connectionById: Map<string, ExtractedConnection>,
  buildingByConnection: Map<string, ExtractedBuilding>,
  data: GameData,
): number | undefined {
  const output = source.connectionIds
    .map((id) => connectionById.get(id))
    .find((connection) => connection && /^Output/i.test(connection.name))
  if (!output?.connectedTo) return undefined
  const adjacent = buildingByConnection.get(output.connectedTo)
  return adjacent ? beltRate(adjacent, data) : undefined
}

function sourceBalance(
  building: ExtractedBuilding,
  data: GameData,
  connectionById: Map<string, ExtractedConnection>,
  buildingByConnection: Map<string, ExtractedBuilding>,
): SourceBalance {
  const mk = mkOf(building.className)
  const nodeData = building.resourceNode ? data.resourceNodes[building.resourceNode] : undefined
  const item = building.resourceItem ?? nodeData?.item ?? 'unknown'
  const purity = nodeData?.purity ?? 'unknown'
  const theoreticalRate = (data.minerRates[mk] ?? 60) * purityMultiplier[purity] * building.clock
  const outputBeltRate = outputBeltCapacity(building, connectionById, buildingByConnection, data)
  return {
    id: building.id,
    miner: machineName(building.className),
    mk,
    clock: building.clock,
    node: building.resourceNode ?? 'Nódulo desconhecido',
    item,
    itemName: itemName(item, data),
    purity,
    theoreticalRate,
    effectiveRate: outputBeltRate ? Math.min(theoreticalRate, outputBeltRate) : theoreticalRate,
    outputBeltRate,
  }
}

function consumerBalance(building: ExtractedBuilding, connectionName: string, data: GameData): ConsumerBalance | undefined {
  const recipeId = classToken(building.recipe)
  const recipe = recipeId ? data.recipes[recipeId] : undefined
  if (!recipe || !recipe.ingredients.length) return undefined
  const port = Number(connectionName.match(/Input(\d+)/i)?.[1] ?? 0)
  const ingredient = recipe.ingredients[port] ?? (recipe.ingredients.length === 1 ? recipe.ingredients[0] : undefined)
  if (!ingredient) return undefined
  return {
    id: building.id,
    machine: machineName(building.className),
    recipe: recipeId!,
    recipeName: recipe.name,
    item: ingredient.item,
    clock: building.clock,
    demand: recipeRate(ingredient.amount, recipe.duration, building.clock),
  }
}

export function analyzeSnapshot(snapshot: SaveSnapshot, data: GameData): AnalysisResult {
  const union = new UnionFind()
  const connectionById = new Map(snapshot.connections.map((connection) => [connection.id, connection]))
  const buildingById = new Map(snapshot.buildings.map((building) => [building.id, building]))
  const buildingByConnection = new Map<string, ExtractedBuilding>()
  for (const building of snapshot.buildings) {
    for (const connectionId of building.connectionIds) buildingByConnection.set(connectionId, building)
  }

  for (const connection of snapshot.connections) {
    union.add(connection.id)
    if (connection.connectedTo) union.union(connection.id, connection.connectedTo)
  }
  for (const building of snapshot.buildings.filter((candidate) => candidate.kind === 'transport')) {
    const [first, ...rest] = building.connectionIds
    if (first) for (const connectionId of rest) union.union(first, connectionId)
  }

  const groups = new Map<string, Set<string>>()
  for (const connection of snapshot.connections) {
    const root = union.find(connection.id)
    const members = groups.get(root) ?? new Set<string>()
    members.add(connection.id)
    groups.set(root, members)
  }

  const lines: LineBalance[] = []
  for (const [root, memberIds] of groups) {
    const sourceBuildings = new Map<string, ExtractedBuilding>()
    const consumerPorts = new Map<string, { building: ExtractedBuilding; connection: ExtractedConnection }>()
    const transportBuildings = new Map<string, ExtractedBuilding>()

    for (const connectionId of memberIds) {
      const connection = connectionById.get(connectionId)
      const building = connection ? buildingById.get(connection.buildingId) : undefined
      if (!connection || !building) continue
      if (building.kind === 'miner' && /^Output/i.test(connection.name)) sourceBuildings.set(building.id, building)
      if (building.kind === 'machine' && /^Input/i.test(connection.name)) consumerPorts.set(connection.id, { building, connection })
      if (building.kind === 'transport') transportBuildings.set(building.id, building)
    }
    if (!sourceBuildings.size) continue

    const sources = [...sourceBuildings.values()].map((building) =>
      sourceBalance(building, data, connectionById, buildingByConnection),
    )
    const consumers = [...consumerPorts.values()]
      .map(({ building, connection }) => consumerBalance(building, connection.name, data))
      .filter((consumer): consumer is ConsumerBalance => Boolean(consumer))
    const sourceItems = new Set(sources.map((source) => source.item))
    const traceable = sourceItems.size === 1 && !sourceItems.has('unknown')
    const item = traceable ? [...sourceItems][0]! : 'mixed'
    const matchingConsumers = traceable ? consumers.filter((consumer) => consumer.item === item) : consumers
    const extraction = sources.reduce((total, source) => total + source.effectiveRate, 0)
    const demand = matchingConsumers.reduce((total, consumer) => total + consumer.demand, 0)
    const balance = extraction - demand
    const beltRates = [...transportBuildings.values()]
      .map((building) => beltRate(building, data))
      .filter((rate): rate is number => rate !== undefined)
    const warnings: string[] = []
    if (!traceable) warnings.push('A linha mistura materiais ou tem origem desconhecida; o saldo não é confiável.')
    if (sources.some((source) => source.purity === 'unknown')) warnings.push('A pureza de pelo menos um nódulo não consta no dataset do mapa.')
    if (!matchingConsumers.length) warnings.push('A linha não chega a uma entrada de máquina reconhecida; pode terminar em buffer ou ponta solta.')
    for (const source of sources) {
      if (source.outputBeltRate && source.outputBeltRate < source.theoreticalRate) {
        warnings.push(`${source.miner}: a esteira de saída limita ${source.theoreticalRate.toFixed(1)} para ${source.outputBeltRate.toFixed(1)}/min.`)
      }
    }

    let suggestion: string | undefined
    if (traceable && balance > 0.05 && matchingConsumers.length) {
      const reference = [...matchingConsumers].sort((left, right) => left.demand - right.demand)[0]!
      const count = Math.floor(balance / reference.demand)
      suggestion = count > 0
        ? `Cabe mais ${count}× ${reference.machine} com ${reference.recipeName} nesta configuração.`
        : `Há folga, mas não o bastante para outra ${reference.machine} com ${reference.recipeName}.`
    }

    const status: LineBalance['status'] = !traceable
      ? 'untraceable'
      : balance < -0.05
        ? 'deficit'
        : Math.abs(balance) <= 0.05
          ? 'balanced'
          : 'surplus'
    lines.push({
      id: root,
      item,
      itemName: traceable ? itemName(item, data) : 'Materiais mistos',
      sources,
      consumers: matchingConsumers,
      extraction,
      demand,
      balance,
      lowestBeltRate: beltRates.length ? Math.min(...beltRates) : undefined,
      merged: sources.length > 1,
      traceable,
      warnings,
      suggestion,
      status,
    })
  }

  const priority: Record<LineBalance['status'], number> = { deficit: 0, untraceable: 1, balanced: 2, surplus: 3 }
  lines.sort((left, right) => priority[left.status] - priority[right.status] || left.balance - right.balance)
  return {
    saveName: snapshot.saveName,
    buildVersion: snapshot.buildVersion,
    generatedAt: new Date().toISOString(),
    stats: { ...snapshot.stats, lines: lines.length, untraceable: lines.filter((line) => !line.traceable).length },
    lines,
    warnings: snapshot.warnings,
  }
}

export { purityLabel }
