import { useEffect } from "react";
import { input } from "./input";
import { useGame } from "../store";

/**
 * Wires keyboard + mouse (pointer-lock-free drag-to-rotate) into the input
 * singleton. Desktop only; mobile uses on-screen controls.
 */
export function useKeyboardMouse() {
  const setPaused = useGame((s) => s.setPaused);

  useEffect(() => {
    const keys: Record<string, boolean> = {};

    const syncMove = () => {
      const f = (keys["w"] || keys["arrowup"] ? 1 : 0) - (keys["s"] || keys["arrowdown"] ? 1 : 0);
      const s = (keys["d"] || keys["arrowright"] ? 1 : 0) - (keys["a"] || keys["arrowleft"] ? 1 : 0);
      input.moveY = f;
      input.moveX = s;
      input.sprint = !!keys["shift"];
      input.brake = !!keys[" "]; // space also brakes in vehicle
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === " ") e.preventDefault();
      if (keys[k]) {
        // ignore auto-repeat for edge triggers
        if (k !== "w" && k !== "a" && k !== "s" && k !== "d") return;
      }
      keys[k] = true;

      if (k === " ") input.jump = true;
      if (k === "f") input.interact = true;
      if (k === "e") input.enterVehicle = true;
      if (k === "h") input.horn = true;
      if (k === "escape") {
        const g = useGame.getState();
        if (g.authorOpen) g.setAuthorOpen(false);
        else if (g.activeSection) g.openSection(null);
        else setPaused(!g.paused);
      }
      syncMove();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys[k] = false;
      if (k === "h") input.horn = false;
      syncMove();
    };

    // drag to rotate camera (left MOUSE button only — touch uses the on-screen
    // look stick, so touch pointer events must never rotate the camera)
    let dragging = false;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      dragging = true;
    };
    const onPointerUp = () => {
      dragging = false;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerType !== "mouse") return;
      input.lookX += e.movementX;
      input.lookY += e.movementY;
    };
    const onWheel = (e: WheelEvent) => {
      input.zoom += Math.sign(e.deltaY);
    };
    const onBlur = () => {
      for (const k in keys) keys[k] = false;
      syncMove();
      dragging = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", onBlur);
    };
  }, [setPaused]);
}
