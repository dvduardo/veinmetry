import { describe, expect, it } from 'vitest'
import { analyzeSnapshot } from './analyze'
import type { ExtractedBuilding, GameData, SaveSnapshot } from '../types'

const data: GameData = {
  generatedAt: '', sources: {},
  items: { Desc_OreIron_C: { name: 'Iron Ore' } },
  recipes: {
    Recipe_IronIngot_C: {
      name: 'Iron Ingot', duration: 2,
      ingredients: [{ item: 'Desc_OreIron_C', amount: 1 }],
      products: [{ item: 'Desc_IronIngot_C', amount: 1 }],
    },
  },
  resourceNodes: {
    nodeA: { item: 'Desc_OreIron_C', purity: 'RP_Normal', x: 0, y: 0, z: 0 },
    nodeB: { item: 'Desc_OreIron_C', purity: 'RP_Normal', x: 1, y: 0, z: 0 },
  },
  minerRates: { Mk1: 60 }, beltRates: { Mk1: 60, Mk2: 120 },
}

const building = (partial: Partial<ExtractedBuilding> & Pick<ExtractedBuilding, 'id' | 'className' | 'kind' | 'connectionIds'>): ExtractedBuilding => ({
  clock: 1, ...partial,
})

function snapshot(buildings: ExtractedBuilding[], links: Array<[string, string, string, string]>): SaveSnapshot {
  return {
    saveName: 'Teste', buildVersion: 1, buildings, warnings: [],
    connections: links.flatMap(([left, leftBuilding, right, rightBuilding]) => [
      { id: left, buildingId: leftBuilding, name: left.split('.').at(-1)!, connectedTo: right },
      { id: right, buildingId: rightBuilding, name: right.split('.').at(-1)!, connectedTo: left },
    ]),
    stats: { objects: buildings.length, miners: buildings.filter((item) => item.kind === 'miner').length, machines: buildings.filter((item) => item.kind === 'machine').length, belts: 1, connections: links.length * 2 },
  }
}

describe('analyzeSnapshot', () => {
  it('calcula mineradora → esteira → duas máquinas', () => {
    const buildings = [
      building({ id: 'miner', className: 'Build_MinerMk1', kind: 'miner', resourceNode: 'nodeA', resourceItem: 'Desc_OreIron_C', connectionIds: ['miner.Output0'] }),
      building({ id: 'belt', className: 'Build_ConveyorBeltMk1', kind: 'transport', connectionIds: ['belt.ConveyorAny0', 'belt.ConveyorAny1'] }),
      building({ id: 'split', className: 'Build_ConveyorAttachmentSplitter', kind: 'transport', connectionIds: ['split.Input0', 'split.Output0', 'split.Output1'] }),
      building({ id: 'smelter1', className: 'Build_SmelterMk1', kind: 'machine', recipe: 'Recipe_IronIngot_C', connectionIds: ['smelter1.Input0'] }),
      building({ id: 'smelter2', className: 'Build_SmelterMk1', kind: 'machine', recipe: 'Recipe_IronIngot_C', connectionIds: ['smelter2.Input0'] }),
    ]
    const result = analyzeSnapshot(snapshot(buildings, [
      ['miner.Output0', 'miner', 'belt.ConveyorAny0', 'belt'],
      ['belt.ConveyorAny1', 'belt', 'split.Input0', 'split'],
      ['split.Output0', 'split', 'smelter1.Input0', 'smelter1'],
      ['split.Output1', 'split', 'smelter2.Input0', 'smelter2'],
    ]), data)
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]).toMatchObject({ extraction: 60, demand: 60, balance: 0, status: 'balanced' })
  })

  it('agrupa duas mineradoras que entram no mesmo merger', () => {
    const buildings = [
      building({ id: 'a', className: 'Build_MinerMk1', kind: 'miner', resourceNode: 'nodeA', resourceItem: 'Desc_OreIron_C', connectionIds: ['a.Output0'] }),
      building({ id: 'b', className: 'Build_MinerMk1', kind: 'miner', resourceNode: 'nodeB', resourceItem: 'Desc_OreIron_C', connectionIds: ['b.Output0'] }),
      building({ id: 'merger', className: 'Build_ConveyorAttachmentMerger', kind: 'transport', connectionIds: ['merger.Input0', 'merger.Input1', 'merger.Output0'] }),
    ]
    const result = analyzeSnapshot(snapshot(buildings, [
      ['a.Output0', 'a', 'merger.Input0', 'merger'],
      ['b.Output0', 'b', 'merger.Input1', 'merger'],
    ]), data)
    expect(result.lines[0]).toMatchObject({ extraction: 120, merged: true })
    expect(result.lines[0]?.sources).toHaveLength(2)
  })

  it('limita a extração pela esteira de saída', () => {
    const buildings = [
      building({ id: 'miner', className: 'Build_MinerMk1', kind: 'miner', clock: 2, resourceNode: 'nodeA', resourceItem: 'Desc_OreIron_C', connectionIds: ['miner.Output0'] }),
      building({ id: 'belt', className: 'Build_ConveyorBeltMk1', kind: 'transport', connectionIds: ['belt.ConveyorAny0', 'belt.ConveyorAny1'] }),
    ]
    const result = analyzeSnapshot(snapshot(buildings, [
      ['miner.Output0', 'miner', 'belt.ConveyorAny0', 'belt'],
    ]), data)
    expect(result.lines[0]?.sources[0]).toMatchObject({ theoreticalRate: 120, effectiveRate: 60, outputBeltRate: 60 })
  })
})
