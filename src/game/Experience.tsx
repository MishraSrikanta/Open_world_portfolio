"use client";

import { Suspense, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Physics } from "@react-three/rapier";
import { Preload, Stars, SoftShadows, useProgress } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";

import { useGame } from "./store";
import { DayNight } from "./world/DayNight";
import { SkyDome } from "./world/SkyDome";
import { Ground } from "./world/Ground";
import { Roads } from "./world/Roads";
import { Fountain } from "./world/Fountain";
import { GrassField } from "./world/GrassField";
import { Trees, Props, TreeColliders } from "./world/Scenery";
import { Clouds, Birds, Butterflies } from "./world/Ambient";
import { Fireflies } from "./world/Fireflies";
import { SectionHubs } from "./world/SectionHubs";
import { SectionScreens } from "./world/SectionScreen";
import { Billboards } from "./world/Billboards";
import { Lanterns } from "./world/Lanterns";
import { Sea } from "./world/Sea";
import { TireMarks } from "./world/TireMarks";
import { JunctionDecor } from "./world/Landmarks";
import { AuthorStatue } from "./world/Statue";
import { ClockTower } from "./world/ClockTower";
import { Player } from "./entities/Player";
import { Vehicle } from "./entities/Vehicle";
import { NPCs } from "./entities/NPCs";
import { Knockables } from "./entities/Knockables";
import { CameraRig } from "./CameraRig";
import { InteractionSystem } from "./InteractionSystem";

/** Pauses physics while the game is paused or a section overlay is open. */
function usePausedFlag() {
  const paused = useGame((s) => s.paused);
  const started = useGame((s) => s.started);
  return !started || paused;
}

export function Experience() {
  const quality = useGame((s) => s.quality);
  const setReady = useGame((s) => s.setReady);
  const setProgress = useGame((s) => s.setProgress);
  const physicsPaused = usePausedFlag();
  const scene = useThree((s) => s.scene);

  // real asset-load progress (glTF, textures, materials via <Preload all/>)
  const { active, progress, item } = useProgress();
  const readyFired = useRef(false);

  useEffect(() => {
    scene.fog = new THREE.Fog("#cfe8ff", 60, 200);
  }, [scene]);

  // surface live progress to the loading UI
  useEffect(() => {
    setProgress(Math.min(progress / 100, 1));
  }, [progress, setProgress]);

  // Enter the World only after loading finishes (loader idle at 100%), plus a
  // couple of frames so the player/camera have settled and won't pop on entry.
  useEffect(() => {
    if (readyFired.current) return;
    const done = !active && progress >= 100;
    if (!done) return;
    let raf = 0;
    const id = setTimeout(() => {
      // wait two animation frames for the first physics/camera step
      raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          readyFired.current = true;
          setReady(true);
        })
      );
    }, 200);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [active, progress, item, setReady]);

  // Safety net: if no async assets ever register (loader stays idle), don't
  // hang on the loading screen forever — reveal after a max wait.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!readyFired.current) {
        readyFired.current = true;
        setReady(true);
      }
    }, 9000);
    return () => clearTimeout(id);
  }, [setReady]);

  return (
    <>
      <SkyDome />
      <Stars radius={300} depth={60} count={quality === "high" ? 1500 : 400} factor={6} fade speed={0.5} />
      <DayNight />
      {quality === "high" && <SoftShadows size={28} samples={8} focus={0.6} />}

      <Suspense fallback={null}>
        <Physics gravity={[0, -22, 0]} paused={physicsPaused} timeStep="vary">
          <Ground />
          <Fountain />
          <SectionHubs />
          <JunctionDecor />
          <AuthorStatue />
          <ClockTower />
          <Knockables />
          <TreeColliders />
          <Player />
          <Vehicle />
          <NPCs />
          <InteractionSystem />
          <CameraRig />
        </Physics>

        {/* Non-colliding decoration outside physics for cheaper stepping */}
        <Roads />
        <GrassField />
        <Trees />
        <Props />
        <Clouds />
        <Birds />
        <Butterflies />
        <Fireflies />
        <SectionScreens />
        <Billboards />
        <Lanterns />
        <Sea />
        <TireMarks />

        <Preload all />
      </Suspense>

      {/* Post FX scale with quality: low skips it entirely (cheapest), medium
          keeps bloom + vignette, high adds SMAA edge antialiasing. */}
      {quality === "high" ? (
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom
            intensity={0.7}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
          <SMAA />
        </EffectComposer>
      ) : quality === "medium" ? (
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
        </EffectComposer>
      ) : null}
    </>
  );
}
