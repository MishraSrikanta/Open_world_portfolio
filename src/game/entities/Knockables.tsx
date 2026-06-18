import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { sharedToonGradient } from "../shaders/toon";
import { JUNCTION_RADIUS } from "../constants";

/**
 * Lightweight dynamic objects scattered around the junction and roads. Because
 * the player capsule and the car are both physics bodies, walking or driving
 * into these crates and bushes sends them tumbling. Mass is kept low so they
 * scatter satisfyingly without launching across the map.
 */

interface Spawn {
  pos: [number, number, number];
  type: "crate" | "barrel" | "bush";
  rot: number;
  tint: string;
}

const CRATE_TINTS = ["#c9923f", "#b97f33", "#d6a44e"];
const BARREL_TINTS = ["#5a7da0", "#7d8b3c", "#a8533f"];

function buildSpawns(): Spawn[] {
  const out: Spawn[] = [];
  // a few neat stacks at the junction rim
  const stackBases: [number, number][] = [
    [JUNCTION_RADIUS - 2, JUNCTION_RADIUS - 6],
    [-(JUNCTION_RADIUS - 6), -(JUNCTION_RADIUS - 2)],
    [JUNCTION_RADIUS - 6, -(JUNCTION_RADIUS - 2)],
  ];
  stackBases.forEach(([bx, bz], s) => {
    for (let i = 0; i < 3; i++) {
      out.push({
        pos: [bx + (i % 2) * 0.05, 0.5 + i * 1.02, bz],
        type: "crate",
        rot: (s + i) * 0.3,
        tint: CRATE_TINTS[i % CRATE_TINTS.length],
      });
    }
  });

  // loose objects along the roads + grass so you bump them while travelling
  let seed = 1;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 26; i++) {
    const r = JUNCTION_RADIUS - 2 + rand() * 26;
    const a = rand() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (Math.hypot(x, z) < JUNCTION_RADIUS - 4) continue; // keep off the fountain
    const roll = rand();
    const type: Spawn["type"] = roll < 0.4 ? "crate" : roll < 0.7 ? "barrel" : "bush";
    out.push({
      pos: [x, 0.6, z],
      type,
      rot: rand() * Math.PI * 2,
      tint:
        type === "barrel"
          ? BARREL_TINTS[i % BARREL_TINTS.length]
          : type === "bush"
          ? "#3f8f47"
          : CRATE_TINTS[i % CRATE_TINTS.length],
    });
  }
  return out;
}

function Knockable({ spawn }: { spawn: Spawn }) {
  const g = sharedToonGradient();
  const common = {
    position: spawn.pos,
    rotation: [0, spawn.rot, 0] as [number, number, number],
    friction: 0.8,
    restitution: 0.1,
    linearDamping: 0.5,
    angularDamping: 0.6,
  };

  if (spawn.type === "barrel")
    return (
      <RigidBody {...common} colliders="hull" mass={0.7}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.45, 0.45, 1.1, 14]} />
          <meshToonMaterial color={spawn.tint} gradientMap={g} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.47, 0.47, 0.12, 14]} />
          <meshToonMaterial color="#2c2c2c" gradientMap={g} />
        </mesh>
      </RigidBody>
    );

  if (spawn.type === "bush")
    return (
      <RigidBody {...common} colliders="ball" mass={0.4}>
        <mesh castShadow>
          <icosahedronGeometry args={[0.6, 0]} />
          <meshToonMaterial color={spawn.tint} gradientMap={g} />
        </mesh>
      </RigidBody>
    );

  return (
    <RigidBody {...common} colliders="cuboid" mass={0.6}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.95, 0.95, 0.95]} />
        <meshToonMaterial color={spawn.tint} gradientMap={g} />
      </mesh>
      {/* plank seam */}
      <mesh position={[0, 0, 0.48]}>
        <boxGeometry args={[0.96, 0.1, 0.02]} />
        <meshToonMaterial color="#7a5320" gradientMap={g} />
      </mesh>
    </RigidBody>
  );
}

export function Knockables() {
  const spawns = useMemo(buildSpawns, []);
  return (
    <group>
      {spawns.map((s, i) => (
        <Knockable key={i} spawn={s} />
      ))}
    </group>
  );
}
