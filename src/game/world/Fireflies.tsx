import * as THREE from "three";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "../store";

/**
 * Small glowing insects (fireflies) that only come out at night. Each one
 * wanders randomly around the junction, bobbing up and down and pulsing its
 * glow. They fade in as dusk falls and vanish during the day. The emissive
 * basic material (toneMapped off) feeds the bloom pass so they truly glow.
 */
export function Fireflies() {
  const quality = useGame((s) => s.quality);
  const count = quality === "high" ? 70 : 28;

  const ref = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const nightRef = useRef(0);

  // per-insect wander parameters; randomised once on spawn
  const data = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        // home patch the insect loosely orbits
        cx: (Math.random() * 2 - 1) * 55,
        cz: (Math.random() * 2 - 1) * 55,
        // independent drift frequencies/phases give organic random motion
        fx: 0.2 + Math.random() * 0.5,
        fz: 0.2 + Math.random() * 0.5,
        fy: 0.5 + Math.random() * 0.8,
        px: Math.random() * Math.PI * 2,
        pz: Math.random() * Math.PI * 2,
        py: Math.random() * Math.PI * 2,
        rx: 2 + Math.random() * 6,
        rz: 2 + Math.random() * 6,
        h: 0.6 + Math.random() * 2.6,
        ry: 0.4 + Math.random() * 0.8,
        // glow blink timing
        blink: 1.5 + Math.random() * 3,
        blinkPhase: Math.random() * Math.PI * 2,
      })),
    [count]
  );

  useLayoutEffect(() => {
    if (ref.current) ref.current.frustumCulled = false;
  }, []);

  useFrame((s, dt) => {
    const mesh = ref.current;
    if (!mesh) return;

    // night factor: 1 deep night, 0 daytime (matches the lighting cycle)
    const tod = useGame.getState().timeOfDay;
    const day = Math.sin(tod * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const night = THREE.MathUtils.clamp((0.32 - day) / 0.2, 0, 1);
    nightRef.current = THREE.MathUtils.damp(nightRef.current, night, 3, dt);
    const lit = nightRef.current;

    // hide entirely (and skip work) once fully daytime
    mesh.visible = lit > 0.01;
    if (matRef.current) matRef.current.opacity = lit;
    if (!mesh.visible) return;

    const t = s.clock.elapsedTime;
    const d = new THREE.Object3D();
    data.forEach((b, i) => {
      d.position.set(
        b.cx + Math.sin(t * b.fx + b.px) * b.rx,
        b.h + Math.sin(t * b.fy + b.py) * b.ry,
        b.cz + Math.cos(t * b.fz + b.pz) * b.rz
      );
      // pulsing blink scales the sprite so the glow visibly flickers
      const blink = 0.4 + Math.abs(Math.sin(t * b.blink + b.blinkPhase)) * 0.6;
      d.scale.setScalar(0.12 * blink * (0.5 + lit * 0.5));
      d.updateMatrix();
      mesh.setMatrixAt(i, d.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        ref={matRef}
        color="#d8ff8a"
        transparent
        opacity={0}
        toneMapped={false}
      />
    </instancedMesh>
  );
}
