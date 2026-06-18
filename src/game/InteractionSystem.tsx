import { useFrame } from "@react-three/fiber";
import { nearestInteractable } from "./interactables";
import { playerPos } from "./playerState";
import { consume } from "./controls/input";
import { useGame } from "./store";

/**
 * Each frame: pick the nearest interactable to the player and publish it to
 * the HUD; fire its handler when the matching button is pressed. The "F"
 * (interact) and "E" (enter/exit vehicle) channels are handled separately so
 * the right prompt shows in each control mode.
 */
export function InteractionSystem() {
  useFrame(() => {
    const st = useGame.getState();
    if (st.paused) return;

    if (st.controlMode === "player") {
      const f = nearestInteractable(playerPos, "interact");
      const v = nearestInteractable(playerPos, "vehicle");

      // prompt prefers the F target, falls back to the vehicle target
      const target = f?.item ?? v?.item ?? null;
      st.setInteractTarget(
        target
          ? {
              id: target.id,
              label: target.label,
              verb: target.channel === "vehicle" ? "E" : "F",
              kind: target.kind,
            }
          : null
      );

      if (consume("interact") && f) f.item.onInteract();
      if (consume("enterVehicle") && v) v.item.onInteract();
    } else {
      // driving: only the exit prompt matters; consumed by the Vehicle itself
      st.setInteractTarget({
        id: "exit-vehicle",
        label: "Exit Vehicle",
        verb: "E",
        kind: "vehicle",
      });
      // clear stray F presses while driving
      consume("interact");
    }
  });

  return null;
}
