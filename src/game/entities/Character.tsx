import * as THREE from "three";
import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { sharedToonGradient } from "../shaders/toon";
import { NPC_HEIGHT } from "../constants";

/**
 * A stylized blocky cartoon character built from primitives. Exposes a simple
 * animation driver: `speed` (0 idle .. 1 run) and `airborne` drive a
 * procedural walk/run cycle (no skeletal rig needed for the MVP).
 */
export function Character({
  state,
}: {
  state: { speed: number; airborne: boolean };
}) {
  const g = sharedToonGradient();
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const sp = state.speed;
    const freq = 8 + sp * 4;
    const amp = 0.15 + sp * 0.7;
    const swing = Math.sin(t * freq) * amp;
    if (armL.current) armL.current.rotation.x = swing;
    if (armR.current) armR.current.rotation.x = -swing;
    if (legL.current) legL.current.rotation.x = -swing;
    if (legR.current) legR.current.rotation.x = swing;
    // idle breathing + run bob
    if (body.current) {
      body.current.position.y = state.airborne
        ? 0.1
        : Math.abs(Math.sin(t * freq)) * 0.06 * sp + Math.sin(t * 2) * 0.02;
    }
  });

  return (
    <group ref={body}>
      {/* torso */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[0.55, 0.7, 0.35]} />
        <meshToonMaterial color="#3b82c4" gradientMap={g} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshToonMaterial color="#f0c39a" gradientMap={g} />
      </mesh>
      {/* hair cap */}
      <mesh position={[0, 1.74, -0.02]} castShadow>
        <boxGeometry args={[0.5, 0.18, 0.5]} />
        <meshToonMaterial color="#3a2a1a" gradientMap={g} />
      </mesh>
      {/* arms */}
      <group ref={armL} position={[-0.36, 1.2, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshToonMaterial color="#3b82c4" gradientMap={g} />
        </mesh>
      </group>
      <group ref={armR} position={[0.36, 1.2, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.18, 0.6, 0.18]} />
          <meshToonMaterial color="#3b82c4" gradientMap={g} />
        </mesh>
      </group>
      {/* legs */}
      <group ref={legL} position={[-0.15, 0.6, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.62, 0.2]} />
          <meshToonMaterial color="#2b3a55" gradientMap={g} />
        </mesh>
      </group>
      <group ref={legR} position={[0.15, 0.6, 0]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[0.2, 0.62, 0.2]} />
          <meshToonMaterial color="#2b3a55" gradientMap={g} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * The lightweight avatar used on medium/low quality. Wraps {@link Character}
 * and auto-fits it to {@link NPC_HEIGHT} (feet at y=0) so the player stands the
 * same height as the villager NPCs — and is far cheaper to draw than the rigged
 * glTF avatar (a handful of boxes vs. a skinned mesh with per-frame shadows).
 */
export function LowPolyAvatar({
  state,
}: {
  state: { speed: number; airborne: boolean };
}) {
  const inner = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const node = inner.current;
    if (!node) return;
    node.scale.setScalar(1);
    node.position.y = 0;
    const box = new THREE.Box3().setFromObject(node);
    const size = new THREE.Vector3();
    box.getSize(size);
    const s = NPC_HEIGHT / (size.y || 1);
    node.scale.setScalar(s);
    node.position.y = -box.min.y * s;
  }, []);
  return (
    <group ref={inner}>
      <Character state={state} />
    </group>
  );
}
