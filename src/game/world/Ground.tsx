import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { WORLD_HALF } from "../constants";
import { sharedToonGradient } from "../shaders/toon";

/**
 * Flat cel-shaded grass ground with a physics floor. A subtle vertex-color
 * mottle keeps the large field from looking dead-flat without textures.
 */
export function Ground() {
  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2, 64, 64);
    g.rotateX(-Math.PI / 2);
    const colors: number[] = [];
    const a = new THREE.Color("#7ec850");
    const b = new THREE.Color("#6fb648");
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const n = Math.sin(pos.getX(i) * 0.08) * Math.cos(pos.getZ(i) * 0.08);
      const c = a.clone().lerp(b, n * 0.5 + 0.5);
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, []);

  return (
    <group>
      <mesh geometry={geom} receiveShadow>
        <meshToonMaterial vertexColors gradientMap={sharedToonGradient()} />
      </mesh>
      <RigidBody type="fixed" colliders={false} friction={1}>
        <CuboidCollider args={[WORLD_HALF, 0.5, WORLD_HALF]} position={[0, -0.5, 0]} />
        {/* invisible perimeter walls so you can't fall off the world */}
        <CuboidCollider args={[WORLD_HALF, 8, 1]} position={[0, 8, -WORLD_HALF]} />
        <CuboidCollider args={[WORLD_HALF, 8, 1]} position={[0, 8, WORLD_HALF]} />
        <CuboidCollider args={[1, 8, WORLD_HALF]} position={[-WORLD_HALF, 8, 0]} />
        <CuboidCollider args={[1, 8, WORLD_HALF]} position={[WORLD_HALF, 8, 0]} />
      </RigidBody>
    </group>
  );
}
