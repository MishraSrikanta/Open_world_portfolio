import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { createGrassMaterial, tickGrass } from "../shaders/GrassMaterial";
import { useGame } from "../store";
import { ROAD_WIDTH, WORLD_HALF } from "../constants";

/**
 * Thousands of wind-animated grass blades via a single InstancedMesh.
 * Count scales with the quality setting. Blades are kept clear of the roads
 * (the +/- axes) so paths stay walkable and readable.
 */
export function GrassField() {
  const quality = useGame((s) => s.quality);
  const count = quality === "high" ? 7000 : 1800;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => createGrassMaterial(), []);

  // a simple two-triangle blade, origin at base, ~0..1 tall (scaled per blade)
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.12, 1, 1, 1);
    g.translate(0, 0.5, 0);
    return g;
  }, []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < count * 4) {
      guard++;
      const x = (Math.random() * 2 - 1) * (WORLD_HALF - 6);
      const z = (Math.random() * 2 - 1) * (WORLD_HALF - 6);
      // skip the road corridors + junction
      const half = ROAD_WIDTH / 2 + 1.5;
      if (Math.abs(x) < half || Math.abs(z) < half) continue;
      if (Math.hypot(x, z) < 16) continue;
      dummy.position.set(x, 0, z);
      dummy.rotation.y = Math.random() * Math.PI;
      const s = 0.7 + Math.random() * 0.9;
      dummy.scale.set(1, s, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(placed, dummy.matrix);
      placed++;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
  }, [count]);

  useFrame((state) => tickGrass(material, state.clock.elapsedTime));

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow={false}
      receiveShadow
    />
  );
}
