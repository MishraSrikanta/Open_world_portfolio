import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "../store";

const SUN_DAY = new THREE.Color("#fff3d6");
const SUN_DUSK = new THREE.Color("#ff9a55");
const AMB_DAY = new THREE.Color("#bcd9ff");
const AMB_NIGHT = new THREE.Color("#26305c");
const FOG_DAY = new THREE.Color("#cfe8ff");
const FOG_NIGHT = new THREE.Color("#0d1430");

// Time-of-day (0..1) targets for the manual modes.
const NOON = 0.5; // bright midday
const MIDNIGHT = 0.0; // deep night

/** Current time of day in India (IST = UTC+5:30, no DST) as a 0..1 fraction. */
function indiaTimeOfDay(): number {
  const now = new Date();
  // shift the UTC instant into IST, then read the wall-clock components
  const istMs = now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600 * 1000;
  const ist = new Date(istMs);
  return (
    (ist.getHours() * 3600 + ist.getMinutes() * 60 + ist.getSeconds()) / 86400
  );
}

/** Shortest-path interpolation on the 0..1 day circle (handles wrap at midnight). */
function lerpCircular(from: number, to: number, k: number): number {
  let d = to - from;
  d -= Math.round(d); // wrap into [-0.5, 0.5]
  return (from + d * k + 1) % 1;
}

/**
 * Drives the full day/night cycle: orbiting sun + moon, color grading of
 * light + fog, and the global timeOfDay store value other systems read.
 */
export function DayNight() {
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const moonRef = useRef<THREE.DirectionalLight>(null);
  const ambRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  // smoothly animated time-of-day so switching modes eases instead of snapping
  const tRef = useRef(useGame.getState().timeOfDay);

  useFrame((state, dt) => {
    const mode = useGame.getState().timeMode;

    // pick the target time-of-day for the active mode
    const target =
      mode === "day" ? NOON : mode === "night" ? MIDNIGHT : indiaTimeOfDay();

    // ease toward the target along the shortest path around the day circle
    const k = THREE.MathUtils.clamp(dt * 1.5, 0, 1);
    tRef.current = lerpCircular(tRef.current, target, k);
    const t = tRef.current;
    useGame.getState().setTimeOfDay(t);

    // sun angle: t=0.25 sunrise(east), 0.5 noon, 0.75 sunset(west)
    const ang = (t - 0.25) * Math.PI * 2;
    const radius = 120;
    const sy = Math.sin(ang) * radius;
    const sx = Math.cos(ang) * radius;
    const dayFactor = THREE.MathUtils.clamp(Math.sin(ang) * 1.4 + 0.15, 0, 1);

    if (sunRef.current) {
      sunRef.current.position.set(sx, Math.max(sy, -20), 40);
      sunRef.current.intensity = dayFactor * 1.6;
      sunRef.current.color.copy(SUN_DUSK).lerp(SUN_DAY, dayFactor);
      sunRef.current.visible = sy > -10;
    }
    if (moonRef.current) {
      moonRef.current.position.set(-sx, Math.max(-sy, -20), -40);
      moonRef.current.intensity = (1 - dayFactor) * 0.35;
      moonRef.current.visible = -sy > -10;
    }
    if (ambRef.current) {
      ambRef.current.intensity = 0.35 + dayFactor * 0.35;
      ambRef.current.color.copy(AMB_NIGHT).lerp(AMB_DAY, dayFactor);
    }
    if (hemiRef.current) {
      hemiRef.current.intensity = 0.3 + dayFactor * 0.6;
    }

    // fog follows the sky
    const fog = state.scene.fog as THREE.Fog | null;
    if (fog) fog.color.copy(FOG_NIGHT).lerp(FOG_DAY, dayFactor);
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.6} />
      <hemisphereLight
        ref={hemiRef}
        color="#cfe8ff"
        groundColor="#5a7d3a"
        intensity={0.7}
      />
      <directionalLight
        ref={sunRef}
        castShadow
        position={[60, 80, 40]}
        intensity={1.6}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={1}
        shadow-camera-far={260}
        shadow-camera-left={-90}
        shadow-camera-right={90}
        shadow-camera-top={90}
        shadow-camera-bottom={-90}
        shadow-bias={-0.0004}
      />
      <directionalLight ref={moonRef} color="#9fb6ff" position={[-60, 60, -40]} />
    </>
  );
}
