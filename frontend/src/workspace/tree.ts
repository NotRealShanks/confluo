import { nameKey, validateName } from "./names";
import { LIMITS, fail, ok, type NodeType, type Result, type TreeNode } from "./types";

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export type TreeView = {
  nodes: ReadonlyMap<string, TreeNode>;
  children: ReadonlyMap<string | null, readonly TreeNode[]>;
  // Names as shown: a clash between siblings is resolved here, never by editing shared data
  displayNames: ReadonlyMap<string, string>;
  truncated: boolean;
};

function parseNode(raw: unknown): TreeNode | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { id, type, name, parentId } = raw as Record<string, unknown>;

  if (typeof id !== "string" || !ID_PATTERN.test(id)) return null;
  if (type !== "file" && type !== "folder") return null;
  const checked = validateName(name);
  if (!checked.ok) return null;

  const parent = typeof parentId === "string" && ID_PATTERN.test(parentId) ? parentId : null;
  return { id, type, name: checked.value, parentId: parent };
}

function splitExtension(name: string): [string, string] {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, ""];
}

function compareNodes(a: TreeNode, b: TreeNode, names: ReadonlyMap<string, string>): number {
  if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
  const byName = (names.get(a.id) ?? a.name).localeCompare(names.get(b.id) ?? b.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return byName !== 0 ? byName : a.id < b.id ? -1 : 1;
}

// Turns whatever is in the shared document into a safe tree. The result depends only on the data,
// never on its order, so every collaborator ends up with the same view.
export function buildTree(raw: readonly unknown[]): TreeView {
  // If an id shows up twice, the smaller record wins, so the outcome never depends on input order
  const rank = (node: TreeNode) => `${node.type}\u0000${node.name}\u0000${node.parentId ?? ""}`;
  const parsed = new Map<string, TreeNode>();
  for (const item of raw) {
    const node = parseNode(item);
    if (!node) continue;
    const existing = parsed.get(node.id);
    if (!existing || rank(node) < rank(existing)) parsed.set(node.id, node);
  }

  let ids = Array.from(parsed.keys()).sort();
  const truncated = ids.length > LIMITS.maxNodes;
  if (truncated) ids = ids.slice(0, LIMITS.maxNodes);
  const kept = new Map(ids.map((id) => [id, parsed.get(id)!]));

  // A parent that is missing, not a folder, or the node itself means the node sits at the top
  const parentOf = new Map<string, string | null>();
  for (const id of ids) {
    const parent = kept.get(id)!.parentId;
    const valid = parent !== null && parent !== id && kept.get(parent)?.type === "folder";
    parentOf.set(id, valid ? parent : null);
  }

  // Concurrent moves can create loops; cut each loop at its smallest id so all clients cut the same edge
  const state = new Map<string, 1 | 2>();
  for (const id of ids) {
    const path: string[] = [];
    let current: string | null = id;
    while (current !== null && !state.has(current)) {
      state.set(current, 1);
      path.push(current);
      current = parentOf.get(current) ?? null;
    }
    if (current !== null && state.get(current) === 1) {
      const cycle = path.slice(path.indexOf(current));
      parentOf.set(cycle.reduce((min, node) => (node < min ? node : min)), null);
    }
    for (const node of path) state.set(node, 2);
  }

  // Anything nested deeper than the limit moves to the top
  const depth = new Map<string, number>();
  const depthOf = (id: string): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    const parent = parentOf.get(id) ?? null;
    const value = parent === null ? 1 : depthOf(parent) + 1;
    depth.set(id, value);
    return value;
  };
  for (const id of ids) {
    if (depthOf(id) > LIMITS.maxDepth) parentOf.set(id, null);
  }

  const nodes = new Map<string, TreeNode>();
  for (const id of ids) nodes.set(id, { ...kept.get(id)!, parentId: parentOf.get(id) ?? null });

  const groups = new Map<string | null, TreeNode[]>([[null, []]]);
  for (const node of nodes.values()) {
    const group = groups.get(node.parentId);
    if (group) group.push(node);
    else groups.set(node.parentId, [node]);
  }

  // Two siblings with the same name: the smaller id keeps it, the other is shown as "name (2)"
  const displayNames = new Map<string, string>();
  for (const group of groups.values()) {
    const used = new Set<string>();
    for (const node of group.sort((a, b) => (a.id < b.id ? -1 : 1))) {
      let shown = node.name;
      if (used.has(nameKey(shown))) {
        const [stem, extension] = splitExtension(node.name);
        for (let n = 2; used.has(nameKey(shown)); n++) shown = `${stem} (${n})${extension}`;
      }
      used.add(nameKey(shown));
      displayNames.set(node.id, shown);
    }
  }

  const children = new Map<string | null, readonly TreeNode[]>();
  for (const [parent, group] of groups) {
    children.set(parent, [...group].sort((a, b) => compareNodes(a, b, displayNames)));
  }

  return { nodes, children, displayNames, truncated };
}

export function displayNameOf(view: TreeView, id: string): string | null {
  return view.displayNames.get(id) ?? null;
}

// 1 for a node at the top level
export function depthOf(view: TreeView, id: string): number {
  let depth = 0;
  let current: string | null = id;
  while (current !== null && view.nodes.has(current) && depth <= LIMITS.maxDepth + 1) {
    depth++;
    current = view.nodes.get(current)!.parentId;
  }
  return depth;
}

export function pathOf(view: TreeView, id: string): string | null {
  if (!view.nodes.has(id)) return null;
  const parts: string[] = [];
  let current: string | null = id;
  while (current !== null && parts.length <= LIMITS.maxDepth) {
    parts.unshift(view.displayNames.get(current) ?? "");
    current = view.nodes.get(current)?.parentId ?? null;
  }
  return parts.join("/");
}

export function descendantIds(view: TreeView, id: string): string[] {
  const result: string[] = [];
  const queue = [id];
  while (queue.length > 0) {
    for (const child of view.children.get(queue.shift()!) ?? []) {
      result.push(child.id);
      queue.push(child.id);
    }
  }
  return result;
}

// Levels in the subtree rooted at id, counting id itself
function subtreeHeight(view: TreeView, id: string): number {
  let height = 1;
  for (const child of view.children.get(id) ?? []) {
    height = Math.max(height, 1 + subtreeHeight(view, child.id));
  }
  return height;
}

function isSelfOrWithin(view: TreeView, id: string, ancestorId: string): boolean {
  let current: string | null = id;
  for (let steps = 0; current !== null && steps <= LIMITS.maxDepth + 1; steps++) {
    if (current === ancestorId) return true;
    current = view.nodes.get(current)?.parentId ?? null;
  }
  return false;
}

function siblingKeys(view: TreeView, parentId: string | null, exceptId?: string): Set<string> {
  const keys = new Set<string>();
  for (const child of view.children.get(parentId) ?? []) {
    if (child.id === exceptId) continue;
    keys.add(nameKey(child.name));
    keys.add(nameKey(view.displayNames.get(child.id) ?? child.name));
  }
  return keys;
}

function checkParent(view: TreeView, parentId: string | null): Result<null> {
  if (parentId === null) return ok(null);
  const parent = view.nodes.get(parentId);
  if (!parent) return fail("That folder no longer exists.");
  if (parent.type !== "folder") return fail("Files can only be placed inside folders.");
  return ok(null);
}

export function validateCreate(
  view: TreeView,
  parentId: string | null,
  _type: NodeType,
  rawName: unknown,
): Result<string> {
  const name = validateName(rawName);
  if (!name.ok) return name;
  const parent = checkParent(view, parentId);
  if (!parent.ok) return parent;

  if (view.truncated || view.nodes.size >= LIMITS.maxNodes) {
    return fail(`A project can hold at most ${LIMITS.maxNodes} files and folders.`);
  }
  if (parentId !== null && depthOf(view, parentId) + 1 > LIMITS.maxDepth) {
    return fail(`Folders can be nested at most ${LIMITS.maxDepth} levels deep.`);
  }
  if (siblingKeys(view, parentId).has(nameKey(name.value))) {
    return fail("Something with that name already exists here.");
  }
  return name;
}

export function validateRename(view: TreeView, id: string, rawName: unknown): Result<string> {
  if (!view.nodes.has(id)) return fail("That item no longer exists.");
  const name = validateName(rawName);
  if (!name.ok) return name;

  const node = view.nodes.get(id)!;
  if (siblingKeys(view, node.parentId, id).has(nameKey(name.value))) {
    return fail("Something with that name already exists here.");
  }
  return name;
}

export function validateMove(view: TreeView, id: string, newParentId: string | null): Result<null> {
  const node = view.nodes.get(id);
  if (!node) return fail("That item no longer exists.");
  const parent = checkParent(view, newParentId);
  if (!parent.ok) return parent;
  if (node.parentId === newParentId) return ok(null);

  if (newParentId !== null && isSelfOrWithin(view, newParentId, id)) {
    return fail("A folder can't be moved into itself.");
  }
  const parentDepth = newParentId === null ? 0 : depthOf(view, newParentId);
  if (parentDepth + subtreeHeight(view, id) > LIMITS.maxDepth) {
    return fail(`Folders can be nested at most ${LIMITS.maxDepth} levels deep.`);
  }
  if (siblingKeys(view, newParentId).has(nameKey(node.name))) {
    return fail("Something with that name already exists there.");
  }
  return ok(null);
}

// "notes.md" becomes "notes (2).md" when the name is taken
export function uniqueName(view: TreeView, parentId: string | null, desired: string): string {
  const taken = siblingKeys(view, parentId);
  if (!taken.has(nameKey(desired))) return desired;
  const [stem, extension] = splitExtension(desired);
  for (let n = 2; ; n++) {
    const candidate = `${stem} (${n})${extension}`;
    if (!taken.has(nameKey(candidate))) return candidate;
  }
}
