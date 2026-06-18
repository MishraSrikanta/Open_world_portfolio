/**
 * Mutable input singleton read every frame by the player, vehicle and camera.
 * Kept outside React state on purpose: movement must never trigger re-renders.
 * Keyboard and the on-screen mobile controls both write here.
 */
export interface InputState {
  // analog move vector, each axis -1..1 (x = strafe, y = forward)
  moveX: number;
  moveY: number;
  // camera look delta accumulated since last frame (mouse / swipe)
  lookX: number;
  lookY: number;
  // zoom delta (wheel / pinch)
  zoom: number;
  // buttons
  sprint: boolean;
  jump: boolean; // edge-triggered, consumed by player
  interact: boolean; // edge-triggered, consumed by gameplay
  enterVehicle: boolean; // edge-triggered
  brake: boolean;
  horn: boolean;
}

export const input: InputState = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  zoom: 0,
  sprint: false,
  jump: false,
  interact: false,
  enterVehicle: false,
  brake: false,
  horn: false,
};

/** Consume an edge-triggered flag (returns true once, then resets). */
export function consume(key: "jump" | "interact" | "enterVehicle"): boolean {
  if (input[key]) {
    input[key] = false;
    return true;
  }
  return false;
}

export function resetFrameDeltas() {
  input.lookX = 0;
  input.lookY = 0;
  input.zoom = 0;
}
