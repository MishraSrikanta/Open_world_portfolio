import * as THREE from "three";

export interface Interactable {
  id: string;
  label: string; // shown in the prompt, e.g. "Explore Projects"
  kind: "section" | "vehicle" | "npc" | "object";
  range: number;
  getPosition: () => THREE.Vector3;
  onInteract: () => void;
  /** Optional: hide from the "enter vehicle" channel vs the "F" channel. */
  channel?: "interact" | "vehicle";
}

const registry = new Map<string, Interactable>();

export function registerInteractable(i: Interactable): () => void {
  registry.set(i.id, i);
  return () => {
    registry.delete(i.id);
  };
}

/** Find the nearest in-range interactable on a given channel. */
export function nearestInteractable(
  from: THREE.Vector3,
  channel: "interact" | "vehicle"
): { item: Interactable; dist: number } | null {
  let best: Interactable | null = null;
  let bestD = Infinity;
  for (const item of registry.values()) {
    const ch = item.channel ?? "interact";
    if (ch !== channel) continue;
    const d = from.distanceTo(item.getPosition());
    if (d <= item.range && d < bestD) {
      bestD = d;
      best = item;
    }
  }
  return best ? { item: best, dist: bestD } : null;
}

export function getInteractable(id: string) {
  return registry.get(id);
}
