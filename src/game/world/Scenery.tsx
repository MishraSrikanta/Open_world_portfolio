import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import { sharedToonGradient } from "../shaders/toon";
import { useGame } from "../store";
import { ROAD_WIDTH, WORLD_HALF } from "../constants";

interface Placement {
  pos: THREE.Vector3;
  rot: number;
  scale: number;
}

function scatter(count: number, minR = 20, clearRoads = true, rand: () => number = Math.random): Placement[] {
  const out: Placement[] = [];
  let guard = 0;
  while (out.length < count && guard < count * 6) {
    guard++;
    const x = (rand() * 2 - 1) * (WORLD_HALF - 8);
    const z = (rand() * 2 - 1) * (WORLD_HALF - 8);
    if (clearRoads) {
      const half = ROAD_WIDTH / 2 + 3;
      if (Math.abs(x) < half || Math.abs(z) < half) continue;
    }
    if (Math.hypot(x, z) < minR) continue;
    out.push({
      pos: new THREE.Vector3(x, 0, z),
      rot: rand() * Math.PI * 2,
      scale: 0.8 + rand() * 0.9,
    });
  }
  return out;
}

/** Deterministic tree placements, cached per count so the visual instances
 * (rendered outside physics) and the trunk colliders (inside physics) line up. */
const treeCache = new Map<number, Placement[]>();
function treePlacements(count: number): Placement[] {
  let cached = treeCache.get(count);
  if (!cached) {
    let seed = 1337 + count;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    cached = scatter(count, 22, true, rand);
    treeCache.set(count, cached);
  }
  return cached;
}

/** Stylized low-poly trees: instanced trunks + two instanced foliage layers. */
export function Trees() {
  const quality = useGame((s) => s.quality);
  const count = quality === "high" ? 110 : 48;
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const leaf2Ref = useRef<THREE.InstancedMesh>(null);
  const placements = useMemo(() => treePlacements(count), [count]);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    placements.forEach((p, i) => {
      // trunk
      d.position.set(p.pos.x, 1.2 * p.scale, p.pos.z);
      d.rotation.set(0, p.rot, 0);
      d.scale.set(p.scale, p.scale, p.scale);
      d.updateMatrix();
      trunkRef.current?.setMatrixAt(i, d.matrix);
      // lower foliage
      d.position.set(p.pos.x, 2.6 * p.scale, p.pos.z);
      d.scale.setScalar(p.scale * 1.6);
      d.updateMatrix();
      leafRef.current?.setMatrixAt(i, d.matrix);
      // upper foliage
      d.position.set(p.pos.x, 3.7 * p.scale, p.pos.z);
      d.scale.setScalar(p.scale * 1.1);
      d.updateMatrix();
      leaf2Ref.current?.setMatrixAt(i, d.matrix);
    });
    [trunkRef, leafRef, leaf2Ref].forEach((r) => {
      if (r.current) r.current.instanceMatrix.needsUpdate = true;
    });
  }, [placements]);

  // gentle sway of the whole canopy group
  const groupRef = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (groupRef.current)
      groupRef.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.6) * 0.012;
  });

  return (
    <group ref={groupRef}>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2.4, 6]} />
        <meshToonMaterial color="#9b6a3c" gradientMap={sharedToonGradient()} />
      </instancedMesh>
      <instancedMesh ref={leafRef} args={[undefined, undefined, count]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshToonMaterial color="#4e9d4e" gradientMap={sharedToonGradient()} />
      </instancedMesh>
      <instancedMesh ref={leaf2Ref} args={[undefined, undefined, count]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshToonMaterial color="#5cb85c" gradientMap={sharedToonGradient()} />
      </instancedMesh>
    </group>
  );
}

/**
 * Static trunk colliders for the trees so the player and vehicle can't walk
 * through them. Rendered inside <Physics>; positions are taken from the same
 * cached placements the visual instances use, so they always line up.
 */
export function TreeColliders() {
  const quality = useGame((s) => s.quality);
  const count = quality === "high" ? 110 : 48;
  const placements = useMemo(() => treePlacements(count), [count]);
  return (
    <group>
      {placements.map((p, i) => (
        <RigidBody key={i} type="fixed" colliders={false} position={[p.pos.x, 0, p.pos.z]}>
          {/* half-height ~1.3 m, radius scaled to the trunk so it blocks cleanly */}
          <CylinderCollider args={[1.3 * p.scale, 0.45 * p.scale]} position={[0, 1.3 * p.scale, 0]} />
        </RigidBody>
      ))}
    </group>
  );
}

/** Low instanced bushes + rocks for ground detail. */
export function Props() {
  const quality = useGame((s) => s.quality);
  const bushCount = quality === "high" ? 160 : 60;
  const rockCount = quality === "high" ? 90 : 40;
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const bushes = useMemo(() => scatter(bushCount, 18), [bushCount]);
  const rocks = useMemo(() => scatter(rockCount, 18), [rockCount]);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    bushes.forEach((p, i) => {
      d.position.set(p.pos.x, 0.4 * p.scale, p.pos.z);
      d.rotation.set(0, p.rot, 0);
      d.scale.setScalar(p.scale);
      d.updateMatrix();
      bushRef.current?.setMatrixAt(i, d.matrix);
    });
    rocks.forEach((p, i) => {
      d.position.set(p.pos.x, 0.25 * p.scale, p.pos.z);
      d.rotation.set(p.rot, p.rot, 0);
      d.scale.setScalar(p.scale * 0.8);
      d.updateMatrix();
      rockRef.current?.setMatrixAt(i, d.matrix);
    });
    if (bushRef.current) bushRef.current.instanceMatrix.needsUpdate = true;
    if (rockRef.current) rockRef.current.instanceMatrix.needsUpdate = true;
  }, [bushes, rocks]);

  return (
    <group>
      <instancedMesh ref={bushRef} args={[undefined, undefined, bushCount]} castShadow>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshToonMaterial color="#3f8f47" gradientMap={sharedToonGradient()} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rockCount]} castShadow>
        <dodecahedronGeometry args={[0.6, 0]} />
        <meshToonMaterial color="#9aa0a6" gradientMap={sharedToonGradient()} />
      </instancedMesh>
    </group>
  );
}
