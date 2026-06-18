import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { JUNCTION_RADIUS, SECTION_LIST } from "../constants";
import { sharedToonGradient } from "../shaders/toon";
import { useGame } from "../store";

/** Floating glowing welcome sign hovering above the fountain. It greets the
 *  player on arrival, then gracefully rises and fades away after a few seconds
 *  so it doesn't clutter the world. */
export function WelcomeMonument() {
  const ref = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const start = useRef(0);
  const gone = useRef(false);
  const SHOW = 7; // fully visible seconds
  const FADE = 3; // fade duration

  useFrame((s) => {
    if (gone.current || !ref.current) return;
    if (start.current === 0) start.current = s.clock.elapsedTime;
    const age = s.clock.elapsedTime - start.current;
    const bob = Math.sin(s.clock.elapsedTime) * 0.2;

    if (age <= SHOW) {
      ref.current.position.y = 5.2 + bob;
      return;
    }
    const k = Math.min((age - SHOW) / FADE, 1); // 0..1 fade progress
    ref.current.position.y = 5.2 + bob + k * 4; // drift upward
    ref.current.scale.setScalar(1 - k * 0.4);
    ref.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m && "opacity" in m) {
        m.transparent = true;
        (m as THREE.Material & { opacity: number }).opacity = 1 - k;
      }
    });
    if (lightRef.current) lightRef.current.intensity = 6 * (1 - k);
    if (k >= 1) {
      ref.current.visible = false;
      gone.current = true;
    }
  });
  return (
    <group ref={ref} position={[0, 5.2, 0]}>
      <Billboard>
        <Text
          fontSize={1.3}
          color="#fff4cf"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.08}
          outlineColor="#5b3b12"
        >
          Welcome
        </Text>
        <Text
          position={[0, -1.1, 0]}
          fontSize={0.5}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#0b1026"
        >
          Choose your path. Every road tells part of my story.
        </Text>
      </Billboard>
      <pointLight ref={lightRef} color="#ffe6a8" intensity={6} distance={18} />
    </group>
  );
}

/** Central wooden signpost with one arrow per section, pointing the way. */
export function Signpost() {
  const g = sharedToonGradient();
  return (
    <group position={[JUNCTION_RADIUS - 4, 0, JUNCTION_RADIUS - 4]}>
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 1.6, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.16, 3.2, 8]} />
          <meshToonMaterial color="#8a5a30" gradientMap={g} />
        </mesh>
      </RigidBody>
      {SECTION_LIST.map((s, i) => {
        const angle = Math.atan2(s.position[0], s.position[2]);
        return (
          <group key={s.id} rotation={[0, angle, 0]} position={[0, 2.6 - i * 0.4, 0]}>
            <mesh position={[0, 0, 1]} castShadow>
              <boxGeometry args={[2.4, 0.5, 0.12]} />
              <meshToonMaterial color={s.color} gradientMap={g} />
            </mesh>
            <Text
              position={[0, 0, 1.07]}
              fontSize={0.28}
              color="#0b1026"
              anchorX="center"
              anchorY="middle"
            >
              {s.title}
            </Text>
          </group>
        );
      })}
    </group>
  );
}

/** A street lamp; its bulb + light fade in at dusk and out at dawn. */
function Lamp({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const bulbRef = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const t = useGame.getState().timeOfDay;
    const day = Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const on = THREE.MathUtils.clamp((0.35 - day) / 0.2, 0, 1);
    if (lightRef.current) lightRef.current.intensity = on * 5;
    if (bulbRef.current) bulbRef.current.opacity = 0.2 + on * 0.8;
  });
  const g = sharedToonGradient();
  return (
    <group position={position}>
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 4, 8]} />
          <meshToonMaterial color="#3c4a5a" gradientMap={g} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 4.1, 0]}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial ref={bulbRef} color="#ffe6a8" transparent />
      </mesh>
      <pointLight ref={lightRef} position={[0, 4.1, 0]} color="#ffdfa0" distance={14} />
    </group>
  );
}

function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const g = sharedToonGradient();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.8, 0.16, 0.6]} />
          <meshToonMaterial color="#a86b3c" gradientMap={g} />
        </mesh>
        <mesh position={[0, 0.9, -0.25]} castShadow>
          <boxGeometry args={[1.8, 0.7, 0.12]} />
          <meshToonMaterial color="#a86b3c" gradientMap={g} />
        </mesh>
      </RigidBody>
    </group>
  );
}

/** Slowly turning toon windmill landmark out in the fields. */
export function Windmill() {
  const bladesRef = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (bladesRef.current) bladesRef.current.rotation.z += dt * 0.8;
  });
  const g = sharedToonGradient();
  return (
    <group position={[-28, 0, 26]}>
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 5, 0]} castShadow>
          <cylinderGeometry args={[1.6, 2.4, 10, 12]} />
          <meshToonMaterial color="#e9dcc0" gradientMap={g} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 10.4, 0]} castShadow>
        <coneGeometry args={[2.6, 2.2, 12]} />
        <meshToonMaterial color="#9b4a3a" gradientMap={g} />
      </mesh>
      <group ref={bladesRef} position={[0, 9, 2]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.4, 6, 0.15]} />
            <meshToonMaterial color="#d8cba8" gradientMap={g} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Crackling campfire with a flickering light and animated flame. */
export function Campfire() {
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame((s) => {
    const f = 1 + Math.sin(s.clock.elapsedTime * 18) * 0.12 + Math.sin(s.clock.elapsedTime * 7) * 0.08;
    if (flameRef.current) flameRef.current.scale.set(1, f, 1);
    if (lightRef.current) lightRef.current.intensity = 4 * f;
  });
  const g = sharedToonGradient();
  return (
    <group position={[24, 0, 22]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.7, 0.15, Math.sin(a) * 0.7]}
            rotation={[0.4, a, 0]}
            castShadow
          >
            <cylinderGeometry args={[0.1, 0.14, 1.2, 6]} />
            <meshToonMaterial color="#7a4a25" gradientMap={g} />
          </mesh>
        );
      })}
      <mesh ref={flameRef} position={[0, 0.7, 0]}>
        <coneGeometry args={[0.45, 1.2, 8]} />
        <meshBasicMaterial color="#ff8a3c" toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 1, 0]} color="#ff9a44" distance={12} />
    </group>
  );
}

/** Lamps + benches ringing the junction, plus the standalone landmarks. */
export function JunctionDecor() {
  const lampAngles = [0.6, 2.0, 3.4, 4.8];
  const r = JUNCTION_RADIUS - 1.5;
  return (
    <group>
      {lampAngles.map((a, i) => (
        <Lamp key={i} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} />
      ))}
      <Bench position={[6, 0, -6]} rotation={Math.PI * 0.75} />
      <Bench position={[-6, 0, -6]} rotation={Math.PI * 1.25} />
      <Signpost />
      <WelcomeMonument />
      <Windmill />
      <Campfire />
    </group>
  );
}
