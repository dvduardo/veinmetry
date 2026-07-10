import type { SatisfactorySave, SaveObject } from '@etothepii/satisfactory-file-parser'
import type { ExtractedBuilding, ExtractedConnection, SaveSnapshot } from '../types'

type LooseObject = SaveObject & {
  parentEntityName?: string
  components?: Array<{ pathName: string }>
  properties: Record<string, { value?: unknown; values?: unknown[] }>
}

const minerPattern = /Build_MinerMk(\d)/i
const machinePattern = /Build_(Smelter|Constructor|Assembler|Manufacturer|Foundry|Packager|Refinery|Blender|ParticleAccelerator|QuantumEncoder)/i
const transportPattern = /Build_(ConveyorBelt|ConveyorLift|ConveyorAttachment|StorageContainer|IndustrialStorage)/i

function className(typePath: string): string {
  return typePath.split('/').at(-1)?.split('.').at(-1)?.replace(/_C$/, '') ?? typePath
}

function objectPath(property: { value?: unknown } | undefined): string | undefined {
  const value = property?.value
  if (!value || typeof value !== 'object' || !('pathName' in value)) return undefined
  return String(value.pathName)
}

function numberValue(property: { value?: unknown } | undefined, fallback: number): number {
  return typeof property?.value === 'number' ? property.value : fallback
}

function allowedItem(objects: LooseObject[], buildingId: string): string | undefined {
  const inventory = objects.find((object) =>
    object.parentEntityName === buildingId && object.typePath.includes('FGInventoryComponent') && object.properties.mAllowedItemDescriptors,
  )
  const first = inventory?.properties.mAllowedItemDescriptors?.values?.[0]
  if (!first || typeof first !== 'object' || !('pathName' in first)) return undefined
  return String(first.pathName).split('.').at(-1)
}

export function extractSave(save: SatisfactorySave): SaveSnapshot {
  const objects = Object.values(save.levels).flatMap((level) => level.objects) as LooseObject[]
  const connectionObjects = objects.filter((object) => object.typePath.includes('FGFactoryConnectionComponent'))
  const connections: ExtractedConnection[] = connectionObjects
    .filter((object) => object.parentEntityName)
    .map((object) => ({
      id: object.instanceName,
      buildingId: object.parentEntityName!,
      name: object.instanceName.split('.').at(-1) ?? object.instanceName,
      connectedTo: objectPath(object.properties.mConnectedComponent),
    }))

  const connectionsByBuilding = new Map<string, string[]>()
  for (const connection of connections) {
    const list = connectionsByBuilding.get(connection.buildingId) ?? []
    list.push(connection.id)
    connectionsByBuilding.set(connection.buildingId, list)
  }

  const buildings: ExtractedBuilding[] = []
  for (const object of objects) {
    const connectionIds = connectionsByBuilding.get(object.instanceName)
    if (!connectionIds?.length) continue
    const kind: ExtractedBuilding['kind'] = minerPattern.test(object.typePath)
      ? 'miner'
      : machinePattern.test(object.typePath)
        ? 'machine'
        : transportPattern.test(object.typePath)
          ? 'transport'
          : 'other'
    if (kind === 'other') continue

    buildings.push({
      id: object.instanceName,
      className: className(object.typePath),
      kind,
      clock: numberValue(object.properties.mCurrentPotential, 1),
      recipe: objectPath(object.properties.mCurrentRecipe)?.split('.').at(-1),
      resourceNode: objectPath(object.properties.mExtractableResource),
      resourceItem: kind === 'miner' ? allowedItem(objects, object.instanceName) : undefined,
      connectionIds,
    })
  }

  const miners = buildings.filter((building) => building.kind === 'miner').length
  const machines = buildings.filter((building) => building.kind === 'machine').length
  const belts = buildings.filter((building) => /Conveyor(Belt|Lift)Mk/i.test(building.className)).length
  const warnings: string[] = []
  if (!miners) warnings.push('Nenhuma mineradora conectada foi encontrada no save.')
  if (save.header.isModdedSave) warnings.push('Este save usa mods; construções de mods podem não ser rastreadas na v1.')

  return {
    saveName: save.header.saveName || save.name,
    buildVersion: save.header.buildVersion,
    buildings,
    connections,
    warnings,
    stats: { objects: objects.length, miners, machines, belts, connections: connections.length },
  }
}
