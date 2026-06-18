import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { sharedToonGradient } from "../shaders/toon";
import { useGame } from "../store";

/** Soft drifting cloud puffs high above the world. */
export function Clouds() {
  const count = 18;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() * 2 - 1) * 180,
        y: 45 + Math.random() * 30,
        z: (Math.random() * 2 - 1) * 180,
        s: 6 + Math.random() * 10,
        speed: 0.6 + Math.random() * 0.8,
      })),
    []
  );
  useFrame((_, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    data.forEach((c, i) => {
      c.x += c.speed * dt;
      if (c.x > 200) c.x = -200;
      d.position.set(c.x, c.y, c.z);
      d.scale.set(c.s, c.s * 0.6, c.s);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 1]} />
      <meshToonMaterial
        color="#ffffff"
        gradientMap={sharedToonGradient()}
        transparent
        opacity={0.92}
      />
    </instancedMesh>
  );
}

/** A small flock of stylized birds orbiting and bobbing across the sky. */
export function Birds() {
  const count = 14;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        r: 30 + Math.random() * 70,
        h: 22 + Math.random() * 18,
        a: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.2,
        flap: Math.random() * Math.PI * 2,
        phase: i,
      })),
    []
  );
  useFrame((s, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    const t = s.clock.elapsedTime;
    data.forEach((b, i) => {
      b.a += b.speed * dt;
      const x = Math.cos(b.a) * b.r;
      const z = Math.sin(b.a) * b.r;
      d.position.set(x, b.h + Math.sin(t + b.phase) * 1.5, z);
      d.rotation.set(0, -b.a + Math.PI / 2, Math.sin(t * 6 + b.flap) * 0.5);
      d.scale.setScalar(1);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  // a flattened "M" bird silhouette
  const geo = useMemo(() => new THREE.ConeGeometry(0.6, 0.15, 3), []);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false}>
      <meshToonMaterial color="#37425e" gradientMap={sharedToonGradient()} />
    </instancedMesh>
  );
}

/** Butterflies that wander in lazy loops near the ground around the junction. */
export function Butterflies() {
  const quality = useGame((s) => s.quality);
  const count = quality === "high" ? 24 : 8;
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        cx: (Math.random() * 2 - 1) * 40,
        cz: (Math.random() * 2 - 1) * 40,
        r: 1.5 + Math.random() * 4,
        h: 0.6 + Math.random() * 1.6,
        a: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.2,
        wing: Math.random() * Math.PI * 2,
      })),
    [count]
  );
  useLayoutEffect(() => {
    if (ref.current) ref.current.frustumCulled = false;
  }, []);
  useFrame((s, dt) => {
    const mesh = ref.current;
    if (!mesh) return;
    const d = new THREE.Object3D();
    const t = s.clock.elapsedTime;
    data.forEach((b, i) => {
      b.a += b.speed * dt;
      d.position.set(
        b.cx + Math.cos(b.a) * b.r,
        b.h + Math.sin(t * 2 + i) * 0.3,
        b.cz + Math.sin(b.a) * b.r
      );
      const flap = Math.abs(Math.sin(t * 12 + b.wing)) * 1.2;
      d.rotation.set(flap, b.a, 0);
      d.scale.setScalar(0.4);
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <planeGeometry args={[1, 0.7]} />
      <meshToonMaterial
        color="#ff8fcf"
        gradientMap={sharedToonGradient()}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}
