import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { sharedToonGradient } from "../shaders/toon";
import "../shaders/WaterMaterial";

const ACCENT = "#67e8f9";
const STONE_DARK = "#2a2e37";
const STONE = "#3a404b";
const STONE_LIGHT = "#525a68";

/** Thin water columns falling from a bowl rim down to the tier below. */
function Streams({
  count,
  radius,
  top,
  height,
}: {
  count: number;
  radius: number;
  top: number;
  height: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = ref.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + Math.sin(s.clock.elapsedTime * 6 + i) * 0.18;
    });
  });
  return (
    <group ref={ref}>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, top - height / 2, Math.sin(a) * radius]}>
            <cylinderGeometry args={[0.02, 0.04, height, 6]} />
            <meshBasicMaterial color="#cdf6ff" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
}

/**
 * Modern multi-tier fountain: a dark polished-stone basin with a glowing cyan
 * accent rim, two stacked bowls feeding water down through thin streams, an
 * animated central jet, and a soft accent light that anchors the junction.
 */
export function Fountain() {
  const poolRef = useRef<THREE.ShaderMaterial & { uTime: number }>(null);
  const bowl1Ref = useRef<THREE.ShaderMaterial & { uTime: number }>(null);
  const bowl2Ref = useRef<THREE.ShaderMaterial & { uTime: number }>(null);
  const jetRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const g = sharedToonGradient();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (poolRef.current) poolRef.current.uTime = t;
    if (bowl1Ref.current) bowl1Ref.current.uTime = t * 1.3;
    if (bowl2Ref.current) bowl2Ref.current.uTime = t * 1.6;
    if (jetRef.current) jetRef.current.scale.y = 1 + Math.sin(t * 3) * 0.12;
    if (lightRef.current)
      lightRef.current.intensity = 2.4 + Math.sin(t * 2) * 0.4;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* ---- basin (solid collider) ---- */}
      <RigidBody type="fixed" colliders="hull">
        {/* outer beveled ring */}
        <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[3.5, 3.8, 0.56, 48]} />
          <meshToonMaterial color={STONE_DARK} gradientMap={g} />
        </mesh>
        {/* inner lip */}
        <mesh position={[0, 0.6, 0]} receiveShadow>
          <cylinderGeometry args={[3.35, 3.5, 0.18, 48]} />
          <meshToonMaterial color={STONE} gradientMap={g} />
        </mesh>
      </RigidBody>

      {/* glowing accent rim */}
      <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.42, 0.05, 8, 64]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>

      {/* main water pool */}
      <mesh position={[0, 0.66, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.3, 48]} />
        <stylizedWaterMaterial ref={poolRef} transparent />
      </mesh>

      {/* ---- central column + tiered bowls ---- */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.34, 0.62, 1.1, 24]} />
        <meshToonMaterial color={STONE_LIGHT} gradientMap={g} />
      </mesh>

      {/* tier 1 bowl */}
      <mesh position={[0, 1.66, 0]} castShadow>
        <cylinderGeometry args={[1.5, 0.5, 0.22, 32]} />
        <meshToonMaterial color={STONE} gradientMap={g} />
      </mesh>
      <mesh position={[0, 1.79, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 32]} />
        <stylizedWaterMaterial ref={bowl1Ref} transparent />
      </mesh>
      <Streams count={10} radius={1.45} top={1.66} height={0.95} />

      {/* column 2 */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.34, 0.9, 20]} />
        <meshToonMaterial color={STONE_LIGHT} gradientMap={g} />
      </mesh>

      {/* tier 2 bowl */}
      <mesh position={[0, 2.62, 0]} castShadow>
        <cylinderGeometry args={[0.85, 0.3, 0.18, 28]} />
        <meshToonMaterial color={STONE} gradientMap={g} />
      </mesh>
      <mesh position={[0, 2.72, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 28]} />
        <stylizedWaterMaterial ref={bowl2Ref} transparent />
      </mesh>
      <Streams count={6} radius={0.8} top={2.62} height={0.85} />

      {/* glowing finial + jet */}
      <mesh position={[0, 2.95, 0]}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>
      <mesh ref={jetRef} position={[0, 3.45, 0]}>
        <cylinderGeometry args={[0.05, 0.1, 1.1, 8]} />
        <meshBasicMaterial color="#e6fbff" transparent opacity={0.75} />
      </mesh>

      <pointLight ref={lightRef} position={[0, 2.4, 0]} color={ACCENT} distance={14} intensity={2.4} />
    </group>
  );
}
