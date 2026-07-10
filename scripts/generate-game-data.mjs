import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const toolsUrl = 'https://raw.githubusercontent.com/greeny/SatisfactoryTools/master/data/data.json'
const mapUrl = 'https://satisfactory-calculator.com/en/interactive-map/index/json'

async function readJson(path, url, headers = {}) {
  if (path) return JSON.parse(await readFile(resolve(path), 'utf8'))
  const response = await fetch(url, { headers })
  if (!response.ok) throw new Error(`Falha ao buscar ${url}: HTTP ${response.status}`)
  return response.json()
}

const tools = await readJson(process.env.SATISFACTORY_TOOLS_DATA, toolsUrl)
const map = await readJson(process.env.SATISFACTORY_MAP_DATA, mapUrl, {
  'X-Requested-With': 'XMLHttpRequest',
  Referer: 'https://satisfactory-calculator.com/en/interactive-map',
})

const items = Object.fromEntries(
  Object.values(tools.items).map((item) => [item.className, { name: item.name }]),
)

const recipes = Object.fromEntries(
  Object.values(tools.recipes)
    .filter((recipe) => recipe.inMachine && !recipe.forBuilding && recipe.time > 0)
    .map((recipe) => [recipe.className, {
      name: recipe.name,
      duration: recipe.time,
      ingredients: recipe.ingredients,
      products: recipe.products,
    }]),
)

const resourceNodes = {}
for (const tab of map.options ?? []) {
  for (const resource of tab.options ?? []) {
    for (const layer of resource.options ?? []) {
      const markers = Array.isArray(layer.markers) ? layer.markers : Object.values(layer.markers ?? {})
      for (const marker of markers) {
        if (!marker.pathName || !marker.type || !marker.purity) continue
        resourceNodes[marker.pathName] = {
          item: marker.type,
          purity: marker.purity,
          x: marker.x,
          y: marker.y,
          z: marker.z,
        }
      }
    }
  }
}

const data = {
  generatedAt: new Date().toISOString(),
  sources: { satisfactoryTools: toolsUrl, satisfactoryMap: mapUrl, mapBuild: map.lastBuild },
  items,
  recipes,
  resourceNodes,
  minerRates: { Mk1: 60, Mk2: 120, Mk3: 240 },
  beltRates: { Mk1: 60, Mk2: 120, Mk3: 270, Mk4: 480, Mk5: 780, Mk6: 1200 },
}

await mkdir(resolve('public'), { recursive: true })
await writeFile(resolve('public/game-data.json'), `${JSON.stringify(data)}\n`)
console.log(`game-data.json: ${Object.keys(recipes).length} receitas, ${Object.keys(resourceNodes).length} nódulos`)
