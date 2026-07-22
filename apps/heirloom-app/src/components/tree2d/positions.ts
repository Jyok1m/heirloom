import { useCallback, useState } from 'react';
import type { PositionOverrides } from './layout';

// Manual node positions, persisted per tree in the browser. Kept separate
// from the domain data so switching to server-side storage later is a
// one-function change (swap the load/save implementation).
const key = (treeId: string) => `heirloom-layout-${treeId}`;

function load(treeId: string): PositionOverrides {
  try {
    const raw = localStorage.getItem(key(treeId));
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, { x: number; y: number }>;
      return new Map(Object.entries(obj));
    }
  } catch {
    /* corrupt entry: start fresh */
  }
  return new Map();
}

function save(treeId: string, positions: PositionOverrides): void {
  localStorage.setItem(
    key(treeId),
    JSON.stringify(Object.fromEntries(positions)),
  );
}

export function usePositions(treeId: string) {
  const [positions, setPositions] = useState<PositionOverrides>(() =>
    load(treeId),
  );

  // Live update during a drag (no persistence yet)
  const move = useCallback(
    (updates: Map<string, { x: number; y: number }>) => {
      setPositions((prev) => {
        const next = new Map(prev);
        for (const [id, pos] of updates) next.set(id, pos);
        return next;
      });
    },
    [],
  );

  // Set one node's position and persist immediately (programmatic placement,
  // e.g. dropping a freshly created relative next to its anchor). No-op if the
  // position is already exactly there.
  const place = useCallback(
    (id: string, pos: { x: number; y: number }) => {
      setPositions((prev) => {
        const next = new Map(prev);
        next.set(id, pos);
        save(treeId, next);
        return next;
      });
    },
    [treeId],
  );

  // Commit the current positions to storage (on drag end)
  const commit = useCallback(() => {
    setPositions((prev) => {
      save(treeId, prev);
      return prev;
    });
  }, [treeId]);

  // Drop overrides for removed persons and re-fit them into the auto-layout
  const reset = useCallback(
    (ids: string[]) => {
      setPositions((prev) => {
        const next = new Map(prev);
        for (const id of ids) next.delete(id);
        save(treeId, next);
        return next;
      });
    },
    [treeId],
  );

  return { positions, move, place, commit, reset };
}
