export class UnionFind {
  private readonly parents = new Map<string, string>()

  add(value: string): void {
    if (!this.parents.has(value)) this.parents.set(value, value)
  }

  find(value: string): string {
    this.add(value)
    const parent = this.parents.get(value)!
    if (parent === value) return value
    const root = this.find(parent)
    this.parents.set(value, root)
    return root
  }

  union(left: string, right: string): void {
    const leftRoot = this.find(left)
    const rightRoot = this.find(right)
    if (leftRoot !== rightRoot) this.parents.set(rightRoot, leftRoot)
  }
}
