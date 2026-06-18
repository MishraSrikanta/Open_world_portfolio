"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";

import { useGame } from "./store";
import { Experience } from "./Experience";
import { useKeyboardMouse } from "./controls/useKeyboardMouse";
import { MobileControls } from "./controls/MobileControls";
import { HUD } from "./ui/HUD";
import { SectionOverlay } from "./ui/SectionOverlay";
import { StartScreen, PauseMenu } from "./ui/Menus";
import { AuthorModal } from "./ui/AuthorModal";
import { SPAWN_POSITION } from "./constants";

/** Detects the input device + a sensible default quality tier. */
function useDeviceSetup() {
  const setTouch = useGame((s) => s.setTouch);
  const setQuality = useGame((s) => s.setQuality);
  useEffect(() => {
    const touch =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setTouch(touch);
    // Default everyone to medium; only drop very weak/touch devices to low.
    // (High is opt-in via the pause menu; PerformanceMonitor still steps down.)
    const cores = navigator.hardwareConcurrency ?? 4;
    const lowMem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 4;
    const weak = touch || cores <= 4 || lowMem <= 4;
    setQuality(weak ? "low" : "medium");
  }, [setTouch, setQuality]);
}

export function Game() {
  useDeviceSetup();
  useKeyboardMouse();
  const setQuality = useGame((s) => s.setQuality);
  const quality = useGame((s) => s.quality);
  const maxDpr = quality === "high" ? 2 : quality === "medium" ? 1.5 : 1.25;

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows
        dpr={[1, maxDpr]}
        gl={{
          antialias: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{
          fov: 55,
          near: 0.1,
          far: 600,
          position: [
            SPAWN_POSITION.x,
            SPAWN_POSITION.y + 4,
            SPAWN_POSITION.z + 9,
          ],
        }}
      >
        <PerformanceMonitor
          // step down one tier on sustained low FPS instead of slamming to low
          onDecline={() =>
            setQuality(
              useGame.getState().quality === "high" ? "medium" : "low"
            )
          }
          flipflops={3}
          onFallback={() => setQuality("low")}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </PerformanceMonitor>
        <AdaptiveDpr pixelated />
      </Canvas>

      {/* DOM UI layer */}
      <HUD />
      <SectionOverlay />
      <AuthorModal />
      <MobileControls />
      <StartScreen />
      <PauseMenu />
    </div>
  );
}
