import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { sharedToonGradient } from "../shaders/toon";
import { registerInteractable } from "../interactables";

/**
 * Player-toggleable lights. Walk up and press F to switch a lantern or glowing
 * bulb on/off. Lit lights flicker subtly and cast a warm point light.
 */

interface LightSpawn {
  id: string;
  pos: [number, number, number];
  kind: "lantern" | "bulb";
  color: string;
  on: boolean;
}

const SPAWNS: LightSpawn[] = [
  { id: "lan-1", pos: [7, 0, 3], kind: "lantern", color: "#ffd27a", on: true },
  { id: "lan-2", pos: [-7, 0, 3], kind: "lantern", color: "#ffb14e", on: true },
  { id: "lan-3", pos: [4, 0, -8], kind: "lantern", color: "#9ad0ff", on: false },
  { id: "bulb-1", pos: [-4, 0, -7], kind: "bulb", color: "#ff7ad0", on: true },
  { id: "bulb-2", pos: [10, 0, -3], kind: "bulb", color: "#7affc4", on: false },
  { id: "bulb-3", pos: [-10, 0, -3], kind: "bulb", color: "#fff0a0", on: true },
];

function Light({ spawn }: { spawn: LightSpawn }) {
  const [on, setOn] = useState(spawn.on);
  const onRef = useRef(on);
  onRef.current = on;
  const lightRef = useRef<THREE.PointLight>(null);
  const glassRef = useRef<THREE.MeshBasicMaterial>(null);
  const worldPos = useRef(new THREE.Vector3(...spawn.pos));
  const g = sharedToonGradient();

  useEffect(() => {
    return registerInteractable({
      id: spawn.id,
      label: "Toggle Light",
      kind: "object",
      range: 3,
      channel: "interact",
      getPosition: () => worldPos.current,
      onInteract: () => setOn((v) => !v),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((s) => {
    const flicker = 0.85 + Math.sin(s.clock.elapsedTime * 12 + worldPos.current.x) * 0.15;
    const target = on ? flicker : 0;
    if (lightRef.current)
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, target * 4, 0.2);
    if (glassRef.current) glassRef.current.opacity = on ? 0.55 + flicker * 0.4 : 0.12;
  });

  if (spawn.kind === "bulb") {
    return (
      <group position={spawn.pos}>
        {/* slim pole */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 2.8, 6]} />
          <meshToonMaterial color="#37414e" gradientMap={g} />
        </mesh>
        {/* hanging filament bulb */}
        <mesh position={[0, 2.7, 0]}>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshBasicMaterial ref={glassRef} color={spawn.color} transparent toneMapped={false} />
        </mesh>
        <pointLight ref={lightRef} position={[0, 2.7, 0]} color={spawn.color} distance={12} />
      </group>
    );
  }

  return (
    <group position={spawn.pos}>
      {/* lantern post */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 2.2, 8]} />
        <meshToonMaterial color="#3a2e22" gradientMap={g} />
      </mesh>
      <mesh position={[0, 2.25, 0]} castShadow>
        <boxGeometry args={[0.5, 0.12, 0.5]} />
        <meshToonMaterial color="#2c2218" gradientMap={g} />
      </mesh>
      {/* glass housing */}
      <mesh position={[0, 2.7, 0]}>
        <boxGeometry args={[0.42, 0.6, 0.42]} />
        <meshBasicMaterial ref={glassRef} color={spawn.color} transparent toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.05, 0]} castShadow>
        <coneGeometry args={[0.35, 0.3, 4]} />
        <meshToonMaterial color="#2c2218" gradientMap={g} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 2.7, 0]} color={spawn.color} distance={13} />
    </group>
  );
}

export function Lanterns() {
  return (
    <group>
      {SPAWNS.map((s) => (
        <Light key={s.id} spawn={s} />
      ))}
    </group>
  );
}
