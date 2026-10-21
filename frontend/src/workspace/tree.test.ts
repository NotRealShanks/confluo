import { describe, expect, it } from "vitest";
import {
  buildTree,
  depthOf,
  descendantIds,
  displayNameOf,
  pathOf,
  uniqueName,
  validateCreate,
  validateMove,
  validateRename,
  type TreeView,
} from "./tree";
import { validateName } from "./names";
import { LIMITS } from "./types";

const file = (id: string, name: string, parentId: string | null = null) => ({ id, type: "file", name, parentId });
const folder = (id: string, name: string, parentId: string | null = null) => ({ id, type: "folder", name, parentId });
const names = (view: TreeView, parent: string | null) => (view.children.get(parent) ?? []).map((n) => view.displayNames.get(n.id));

describe("buildTree", () => {
  it("sorts folders first, then names with numbers in natural order", () => {
    const view = buildTree([file("a", "file10.txt"), file("b", "file2.txt"), folder("c", "zeta"), folder("d", "alpha")]);
    expect(names(view, null)).toEqual(["alpha", "zeta", "file2.txt", "file10.txt"]);
  });

  it("picks the same record for a repeated id whatever the input order", () => {
    const first = buildTree([file("a", "one.txt"), file("a", "two.txt")]);
    const second = buildTree([file("a", "two.txt"), file("a", "one.txt")]);
    expect(first.nodes.get("a")?.name).toBe("one.txt");
    expect(second.nodes.get("a")?.name).toBe("one.txt");
  });

  it("drops nodes that are malformed or have unsafe names", () => {
    const view = buildTree([
      file("good", "ok.txt"),
      file("bad name", "x.txt"),
      file("slash", "a/b.txt"),
      file("dots", ".."),
      { id: "type", type: "symlink", name: "x", parentId: null },
      { id: "noname", type: "file", parentId: null },
      "a string",
      42,
      null,
      undefined,
      [],
    ]);
    expect(Array.from(view.nodes.keys())).toEqual(["good"]);
  });

  it("places orphans, self-parented nodes and nodes under a file at the top level", () => {
    const view = buildTree([
      file("orphan", "orphan.txt", "missing"),
      folder("self", "self", "self"),
      file("host", "host.txt"),
      file("underfile", "x.txt", "host"),
    ]);
    for (const id of ["orphan", "self", "underfile"]) {
      expect(view.nodes.get(id)?.parentId).toBeNull();
    }
  });

  it("breaks a two-node loop at the smaller id, the same way every time", () => {
    const items = [folder("b", "b", "a"), folder("a", "a", "b")];
    const forward = buildTree(items);
    const reversed = buildTree([...items].reverse());
    expect(forward.nodes.get("a")?.parentId).toBeNull();
    expect(forward.nodes.get("b")?.parentId).toBe("a");
    expect(reversed.nodes.get("a")?.parentId).toBeNull();
    expect(reversed.nodes.get("b")?.parentId).toBe("a");
  });

  it("breaks a longer loop that has a tail leading into it", () => {
    const view = buildTree([folder("c", "c", "b"), folder("b", "b", "a"), folder("a", "a", "c"), file("t", "t.txt", "c")]);
    expect(view.nodes.get("a")?.parentId).toBeNull();
    expect(pathOf(view, "t")).toBe("a/b/c/t.txt");
  });

  it("shows a duplicate sibling name with a suffix, keeping the smaller id's name", () => {
    const view = buildTree([file("b", "Notes.md"), file("a", "notes.md"), file("c", "NOTES.md")]);
    expect(displayNameOf(view, "a")).toBe("notes.md");
    expect(displayNameOf(view, "b")).toBe("Notes (2).md");
    expect(displayNameOf(view, "c")).toBe("NOTES (3).md");
  });

  it("allows the same name in different folders", () => {
    const view = buildTree([folder("f1", "one"), folder("f2", "two"), file("a", "main.js", "f1"), file("b", "main.js", "f2")]);
    expect(displayNameOf(view, "a")).toBe("main.js");
    expect(displayNameOf(view, "b")).toBe("main.js");
  });

  it("caps the number of nodes and says so", () => {
    const many = Array.from({ length: LIMITS.maxNodes + 25 }, (_, i) => file(`n${String(i).padStart(4, "0")}`, `f${i}.txt`));
    const view = buildTree(many);
    expect(view.nodes.size).toBe(LIMITS.maxNodes);
    expect(view.truncated).toBe(true);
  });

  it("moves anything nested deeper than the limit to the top level", () => {
    const chain = Array.from({ length: LIMITS.maxDepth + 3 }, (_, i) =>
      folder(`d${String(i).padStart(2, "0")}`, `level${i}`, i === 0 ? null : `d${String(i - 1).padStart(2, "0")}`),
    );
    const view = buildTree(chain);
    for (const node of view.nodes.values()) {
      expect(depthOf(view, node.id)).toBeLessThanOrEqual(LIMITS.maxDepth);
    }
  });
});

describe("pathOf, depthOf and descendantIds", () => {
  const view = buildTree([folder("src", "src"), folder("ui", "ui", "src"), file("btn", "Button.tsx", "ui"), file("readme", "README.md")]);

  it("builds slash-separated paths from display names", () => {
    expect(pathOf(view, "btn")).toBe("src/ui/Button.tsx");
    expect(pathOf(view, "readme")).toBe("README.md");
    expect(pathOf(view, "nope")).toBeNull();
  });

  it("counts depth from one", () => {
    expect(depthOf(view, "readme")).toBe(1);
    expect(depthOf(view, "btn")).toBe(3);
  });

  it("lists everything inside a folder", () => {
    expect(descendantIds(view, "src").sort()).toEqual(["btn", "ui"]);
    expect(descendantIds(view, "readme")).toEqual([]);
  });
});

describe("validateCreate", () => {
  const view = buildTree([folder("src", "src"), file("a", "a.txt", "src"), file("top", "top.txt")]);

  it("accepts a fresh name and returns the normalized form", () => {
    expect(validateCreate(view, "src", "file", "  b.txt ")).toEqual({ ok: true, value: "b.txt" });
  });

  it.each([
    ["a name that is taken, ignoring case", "src", "A.TXT"],
    ["an invalid name", "src", "../x"],
    ["a missing parent", "ghost", "b.txt"],
    ["a file as parent", "top", "b.txt"],
  ])("rejects %s", (_label, parent, name) => {
    expect(validateCreate(view, parent, "file", name).ok).toBe(false);
  });

  it("rejects creation past the nesting limit", () => {
    const chain = Array.from({ length: LIMITS.maxDepth }, (_, i) =>
      folder(`d${i}`, `l${i}`, i === 0 ? null : `d${i - 1}`),
    );
    const deep = buildTree(chain);
    expect(validateCreate(deep, `d${LIMITS.maxDepth - 1}`, "folder", "tooDeep").ok).toBe(false);
    expect(validateCreate(deep, `d${LIMITS.maxDepth - 2}`, "folder", "fits").ok).toBe(true);
  });

  it("rejects creation when the project is full", () => {
    const full = buildTree(Array.from({ length: LIMITS.maxNodes }, (_, i) => file(`n${i}`, `f${i}.txt`)));
    expect(validateCreate(full, null, "file", "one-more.txt").ok).toBe(false);
  });
});

describe("validateRename", () => {
  const view = buildTree([file("a", "a.txt"), file("b", "b.txt")]);

  it("allows renaming to a free name, or to its own name in another case", () => {
    expect(validateRename(view, "a", "c.txt").ok).toBe(true);
    expect(validateRename(view, "a", "A.TXT").ok).toBe(true);
  });

  it("rejects a sibling's name, an invalid name, and a missing node", () => {
    expect(validateRename(view, "a", "b.txt").ok).toBe(false);
    expect(validateRename(view, "a", "x/y").ok).toBe(false);
    expect(validateRename(view, "ghost", "x.txt").ok).toBe(false);
  });
});

describe("validateMove", () => {
  const view = buildTree([
    folder("a", "a"),
    folder("b", "b", "a"),
    folder("c", "c", "b"),
    file("f", "f.txt", "c"),
    folder("z", "z"),
    file("dup", "f.txt", "z"),
  ]);

  it("allows a move to a free place, including back to the top", () => {
    expect(validateMove(view, "b", "z").ok).toBe(true);
    expect(validateMove(view, "c", null).ok).toBe(true);
  });

  it("treats moving to the current parent as a no-op", () => {
    expect(validateMove(view, "b", "a").ok).toBe(true);
  });

  it("rejects moving a folder into itself or its own descendant", () => {
    expect(validateMove(view, "a", "a").ok).toBe(false);
    expect(validateMove(view, "a", "c").ok).toBe(false);
  });

  it("rejects a file as destination, a missing node, a missing folder, and a name clash", () => {
    expect(validateMove(view, "b", "f").ok).toBe(false);
    expect(validateMove(view, "ghost", null).ok).toBe(false);
    expect(validateMove(view, "b", "ghost").ok).toBe(false);
    expect(validateMove(view, "f", "z").ok).toBe(false);
  });

  it("rejects a move that would push the subtree past the nesting limit", () => {
    const chain = Array.from({ length: LIMITS.maxDepth - 1 }, (_, i) => folder(`d${i}`, `l${i}`, i === 0 ? null : `d${i - 1}`));
    const deep = buildTree([...chain, folder("x", "x"), file("y", "y.txt", "x")]);
    expect(validateMove(deep, "x", `d${LIMITS.maxDepth - 2}`).ok).toBe(false);
  });
});

describe("uniqueName", () => {
  const view = buildTree([file("a", "notes.md"), file("b", "notes (2).md"), file("c", "todo")]);

  it("returns the desired name when free, otherwise the next numbered one", () => {
    expect(uniqueName(view, null, "fresh.md")).toBe("fresh.md");
    expect(uniqueName(view, null, "notes.md")).toBe("notes (3).md");
    expect(uniqueName(view, null, "todo")).toBe("todo (2)");
  });
});

// A tiny seeded generator keeps the random tests repeatable
function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomRaw(random: () => number): unknown[] {
  const idPool = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "bad id", "", "x".repeat(70)];
  const namePool = ["a.txt", "A.TXT", "b", "dir", "Dir", "..", "x/y", "", "-v", "con", "ok.js", "e\u0301", "\u00e9", 5, null, undefined];
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(random() * items.length)];

  return Array.from({ length: Math.floor(random() * 60) }, () => {
    const roll = random();
    if (roll < 0.06) return pick(["junk", 7, null, undefined, [], true]);
    return {
      id: pick(idPool),
      type: pick(["file", "folder", "folder", "other", 3]),
      name: pick(namePool),
      parentId: pick([...idPool, null, null, undefined, 5]),
    };
  });
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

describe("buildTree on random garbage", () => {
  it("always returns a safe, consistent tree and never throws", () => {
    const random = mulberry32(20261018);
    for (let round = 0; round < 400; round++) {
      const raw = randomRaw(random);
      const view = buildTree(raw);

      expect(view.nodes.size).toBeLessThanOrEqual(LIMITS.maxNodes);

      for (const node of view.nodes.values()) {
        expect(validateName(node.name).ok).toBe(true);
        expect(node.id).toMatch(/^[A-Za-z0-9_-]{1,64}$/);

        // Walking up always ends at the top within the depth limit, without revisiting anything
        const seen = new Set<string>();
        let current: string | null = node.id;
        let steps = 0;
        while (current !== null) {
          expect(seen.has(current)).toBe(false);
          seen.add(current);
          const parent: string | null = view.nodes.get(current)!.parentId;
          if (parent !== null) expect(view.nodes.get(parent)?.type).toBe("folder");
          current = parent;
          steps++;
        }
        expect(steps).toBeLessThanOrEqual(LIMITS.maxDepth);
      }

      // Every node appears exactly once in the children lists
      const listed = Array.from(view.children.values()).flat().map((n) => n.id).sort();
      expect(listed).toEqual(Array.from(view.nodes.keys()).sort());

      // Display names are unique among siblings
      for (const group of view.children.values()) {
        const keys = group.map((n) => (view.displayNames.get(n.id) ?? "").normalize("NFC").toLowerCase());
        expect(new Set(keys).size).toBe(keys.length);
      }

      // Order of the input never changes the result
      const again = buildTree(shuffled(raw, random));
      expect(Array.from(again.displayNames.entries()).sort()).toEqual(Array.from(view.displayNames.entries()).sort());
      expect(Array.from(again.nodes.values()).map((n) => `${n.id}:${n.parentId}`).sort()).toEqual(
        Array.from(view.nodes.values()).map((n) => `${n.id}:${n.parentId}`).sort(),
      );
    }
  });
});
