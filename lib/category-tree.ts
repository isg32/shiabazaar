export interface FlatCategory {
  id: string;
  name: string;
  slug: string;
  group: string;
  parentId: string | null;
  active?: boolean;
  position?: number;
}

export interface CategoryNode extends FlatCategory {
  children: CategoryNode[];
}

// Builds a nested tree from a flat list. Pass `group` to scope to one root bucket
// (e.g. "book" / "gift" / "other"); omit to build every group's trees at once.
export function buildCategoryTree(flat: FlatCategory[], group?: string): CategoryNode[] {
  const scoped = group ? flat.filter((c) => c.group === group) : flat;
  const map = new Map<string, CategoryNode>();
  scoped.forEach((c) => map.set(c.id, { ...c, children: [] }));

  const roots: CategoryNode[] = [];
  scoped.forEach((c) => {
    const node = map.get(c.id)!;
    const parent = c.parentId ? map.get(c.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const sortRec = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

// [rootId, ...every descendant id] — used to aggregate products across a subtree.
export function getDescendantIds(flat: { id: string; parentId: string | null }[], rootId: string): string[] {
  const childrenOf = new Map<string, string[]>();
  for (const c of flat) {
    if (!c.parentId) continue;
    const arr = childrenOf.get(c.parentId) ?? [];
    arr.push(c.id);
    childrenOf.set(c.parentId, arr);
  }

  const result: string[] = [rootId];
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const childId of childrenOf.get(id) ?? []) {
      result.push(childId);
      stack.push(childId);
    }
  }
  return result;
}

export function countDescendants(flat: { id: string; parentId: string | null }[], rootId: string): number {
  return getDescendantIds(flat, rootId).length - 1;
}

// Pre-order flatten with depth — for rendering a tree as an indented <select>.
export function flattenTreeWithDepth(nodes: CategoryNode[], depth = 0): { node: CategoryNode; depth: number }[] {
  const out: { node: CategoryNode; depth: number }[] = [];
  for (const node of nodes) {
    out.push({ node, depth });
    out.push(...flattenTreeWithDepth(node.children, depth + 1));
  }
  return out;
}
