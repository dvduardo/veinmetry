export type Purity = 'RP_Inpure' | 'RP_Normal' | 'RP_Pure' | 'unknown'

export interface GameItem {
  name: string
}

export interface RecipeAmount {
  item: string
  amount: number
}

export interface GameRecipe {
  name: string
  duration: number
  ingredients: RecipeAmount[]
  products: RecipeAmount[]
}

export interface ResourceNodeData {
  item: string
  purity: Purity
  x: number
  y: number
  z: number
}

export interface GameData {
  generatedAt: string
  sources: Record<string, string | number>
  items: Record<string, GameItem>
  recipes: Record<string, GameRecipe>
  resourceNodes: Record<string, ResourceNodeData>
  minerRates: Record<string, number>
  beltRates: Record<string, number>
}

export interface ExtractedBuilding {
  id: string
  className: string
  kind: 'miner' | 'machine' | 'transport' | 'other'
  clock: number
  recipe?: string
  resourceNode?: string
  resourceItem?: string
  connectionIds: string[]
}

export interface ExtractedConnection {
  id: string
  buildingId: string
  name: string
  connectedTo?: string
}

export interface SaveSnapshot {
  saveName: string
  buildVersion: number
  buildings: ExtractedBuilding[]
  connections: ExtractedConnection[]
  warnings: string[]
  stats: {
    objects: number
    miners: number
    machines: number
    belts: number
    connections: number
  }
}

export interface SourceBalance {
  id: string
  miner: string
  mk: string
  clock: number
  node: string
  item: string
  itemName: string
  purity: Purity
  theoreticalRate: number
  effectiveRate: number
  outputBeltRate?: number
}

export interface ConsumerBalance {
  id: string
  machine: string
  recipe: string
  recipeName: string
  item: string
  clock: number
  demand: number
}

export interface LineBalance {
  id: string
  item: string
  itemName: string
  sources: SourceBalance[]
  consumers: ConsumerBalance[]
  extraction: number
  demand: number
  balance: number
  lowestBeltRate?: number
  merged: boolean
  traceable: boolean
  warnings: string[]
  suggestion?: string
  status: 'deficit' | 'balanced' | 'surplus' | 'untraceable'
}

export interface AnalysisResult {
  saveName: string
  buildVersion: number
  generatedAt: string
  stats: SaveSnapshot['stats'] & { lines: number; untraceable: number }
  lines: LineBalance[]
  warnings: string[]
}

export type WorkerRequest = {
  type: 'analyze'
  fileName: string
  buffer: ArrayBuffer
  gameData: GameData
}

export type WorkerResponse =
  | { type: 'progress'; progress: number; message: string }
  | { type: 'result'; result: AnalysisResult }
  | { type: 'error'; message: string }
