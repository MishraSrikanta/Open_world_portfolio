import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { SECTION_LIST, type SectionDef } from "../constants";
import { sharedToonGradient } from "../shaders/toon";
import { registerInteractable } from "../interactables";
import { useGame } from "../store";

/** Per-section landmark geometry, all from cheap primitives + toon shading. */
function Landmark({ s }: { s: SectionDef }) {
  const g = sharedToonGradient();
  switch (s.id) {
    case "projects": // marketplace stalls
      return (
        <group>
          {[-4, 0, 4].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              <mesh position={[0, 1, 0]} castShadow>
                <boxGeometry args={[3, 2, 3]} />
                <meshToonMaterial color="#d7c9a6" gradientMap={g} />
              </mesh>
              <mesh position={[0, 2.3, 0]} castShadow>
                <coneGeometry args={[2.6, 1.2, 4]} />
                <meshToonMaterial color={i % 2 ? "#e06c5a" : "#5aa9e0"} gradientMap={g} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "about": // cozy house
      return (
        <group>
          <mesh position={[0, 2, 0]} castShadow>
            <boxGeometry args={[8, 4, 7]} />
            <meshToonMaterial color="#f0e2c0" gradientMap={g} />
          </mesh>
          <mesh position={[0, 4.6, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[6.5, 3, 4]} />
            <meshToonMaterial color="#b9533f" gradientMap={g} />
          </mesh>
          <mesh position={[0, 1.2, 3.6]}>
            <boxGeometry args={[1.6, 2.4, 0.2]} />
            <meshToonMaterial color="#7a4a25" gradientMap={g} />
          </mesh>
        </group>
      );
    case "story": // standing memory stones
      return (
        <group>
          {[-3, 0, 3].map((x, i) => (
            <mesh key={i} position={[x, 2 - i * 0.2, i % 2 ? 1 : -1]} castShadow>
              <boxGeometry args={[1.4, 4 - i * 0.3, 0.8]} />
              <meshToonMaterial color="#8a7fae" gradientMap={g} />
            </mesh>
          ))}
        </group>
      );
    case "welcome": // park arch
    default:
      return (
        <group>
          {[-3.5, 3.5].map((x, i) => (
            <mesh key={i} position={[x, 2.5, 0]} castShadow>
              <cylinderGeometry args={[0.4, 0.4, 5, 10]} />
              <meshToonMaterial color="#e7d7b0" gradientMap={g} />
            </mesh>
          ))}
          <mesh position={[0, 5, 0]} castShadow>
            <boxGeometry args={[8.4, 0.8, 1]} />
            <meshToonMaterial color="#46c08a" gradientMap={g} />
          </mesh>
        </group>
      );
  }
}

function Hub({ s }: { s: SectionDef }) {
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const openSection = useGame((st) => st.openSection);
  const discover = useGame((st) => st.discover);
  const center = new THREE.Vector3(...s.position);
  // pull landmark slightly back so the portal sits at the road's end
  const portal = center.clone();

  useEffect(() => {
    return registerInteractable({
      id: `section-${s.id}`,
      label: `Explore ${s.title}`,
      kind: "section",
      range: 6,
      channel: "interact",
      getPosition: () => portal,
      onInteract: () => {
        discover(`section-${s.id}`, s.title);
        openSection(s.id);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.6;
    if (glowRef.current)
      glowRef.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 2) * 0.8;
  });

  return (
    <group position={s.position}>
      <RigidBody type="fixed" colliders="cuboid">
        <group position={[0, 0, s.id === "welcome" ? 6 : 8]}>
          <Landmark s={s} />
        </group>
      </RigidBody>

      {/* glowing interaction portal at road's end */}
      <group position={[0, 0, -2]}>
        <mesh ref={ringRef} position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.18, 12, 40]} />
          <meshBasicMaterial color={s.color} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.2, 32]} />
          <meshBasicMaterial color={s.color} transparent opacity={0.25} toneMapped={false} />
        </mesh>
        <pointLight ref={glowRef} position={[0, 2, 0]} color={s.color} distance={16} />
        <Billboard position={[0, 4.4, 0]}>
          <Text
            fontSize={1}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.06}
            outlineColor="#0b1026"
          >
            {s.title}
          </Text>
          <Text
            position={[0, -0.85, 0]}
            fontSize={0.42}
            color={s.color}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.03}
            outlineColor="#0b1026"
          >
            {s.subtitle}
          </Text>
        </Billboard>
      </group>
    </group>
  );
}

export function SectionHubs() {
  return (
    <>
      {SECTION_LIST.map((s) => (
        <Hub key={s.id} s={s} />
      ))}
    </>
  );
}
