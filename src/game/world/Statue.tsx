import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { RigidBody, CylinderCollider } from "@react-three/rapier";
import { sharedToonGradient } from "../shaders/toon";
import { registerInteractable } from "../interactables";
import { useGame } from "../store";
import { PROFILE } from "../content";

/**
 * A bronze statue of the author standing on a stone pedestal. Walking up and
 * pressing F (or the mobile Interact button) opens the "About the Author"
 * modal. A slowly rotating accent ring + plaque draw the player in.
 */
const STATUE_POS = new THREE.Vector3(-5, 0, -5);

export function AuthorStatue() {
  const g = sharedToonGradient();
  const ringRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    return registerInteractable({
      id: "author-statue",
      label: `Learn about ${PROFILE.name.split(" ")[0]}`,
      kind: "object",
      range: 3.5,
      channel: "interact",
      getPosition: () => STATUE_POS,
      onInteract: () => useGame.getState().setAuthorOpen(true),
    });
  }, []);

  useFrame((s) => {
    if (ringRef.current) ringRef.current.rotation.z = s.clock.elapsedTime * 0.5;
    if (glowRef.current)
      glowRef.current.intensity = 1.6 + Math.sin(s.clock.elapsedTime * 2) * 0.5;
  });

  const bronze = "#b5895a";
  const bronzeDark = "#8a6438";

  return (
    <group position={STATUE_POS.toArray()}>
      {/* pedestal — solid so you bump into it */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider args={[0.55, 1.05]} position={[0, 0.55, 0]} />
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.15, 1.3, 0.36, 24]} />
          <meshToonMaterial color="#3b3f47" gradientMap={g} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 1.0, 0.6, 24]} />
          <meshToonMaterial color="#4a4f59" gradientMap={g} />
        </mesh>
      </RigidBody>

      {/* glowing accent ring just above the pedestal */}
      <mesh ref={ringRef} position={[0, 0.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.04, 8, 48]} />
        <meshBasicMaterial color="#67e8f9" toneMapped={false} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 1.6, 0]} color="#67e8f9" distance={9} />

      {/* the bronze figure (stylized standing developer) */}
      <group position={[0, 0.92, 0]}>
        {/* legs */}
        <mesh position={[-0.16, 0.45, 0]} castShadow>
          <boxGeometry args={[0.22, 0.9, 0.24]} />
          <meshToonMaterial color={bronzeDark} gradientMap={g} />
        </mesh>
        <mesh position={[0.16, 0.45, 0]} castShadow>
          <boxGeometry args={[0.22, 0.9, 0.24]} />
          <meshToonMaterial color={bronzeDark} gradientMap={g} />
        </mesh>
        {/* torso */}
        <mesh position={[0, 1.18, 0]} castShadow>
          <boxGeometry args={[0.62, 0.78, 0.34]} />
          <meshToonMaterial color={bronze} gradientMap={g} />
        </mesh>
        {/* arm holding a "laptop" forward */}
        <mesh position={[0.34, 1.25, 0.1]} rotation={[0, 0, -0.4]} castShadow>
          <boxGeometry args={[0.16, 0.5, 0.16]} />
          <meshToonMaterial color={bronze} gradientMap={g} />
        </mesh>
        <mesh position={[-0.34, 1.25, 0.1]} rotation={[0, 0, 0.4]} castShadow>
          <boxGeometry args={[0.16, 0.5, 0.16]} />
          <meshToonMaterial color={bronze} gradientMap={g} />
        </mesh>
        {/* laptop in hands */}
        <mesh position={[0, 1.12, 0.34]} rotation={[-0.5, 0, 0]} castShadow>
          <boxGeometry args={[0.5, 0.04, 0.34]} />
          <meshToonMaterial color={bronzeDark} gradientMap={g} />
        </mesh>
        <mesh position={[0, 1.28, 0.2]} rotation={[0.35, 0, 0]}>
          <boxGeometry args={[0.5, 0.32, 0.03]} />
          <meshBasicMaterial color="#67e8f9" toneMapped={false} />
        </mesh>
        {/* head */}
        <mesh position={[0, 1.78, 0]} castShadow>
          <boxGeometry args={[0.36, 0.4, 0.36]} />
          <meshToonMaterial color={bronze} gradientMap={g} />
        </mesh>
        {/* hair cap */}
        <mesh position={[0, 1.98, -0.02]} castShadow>
          <boxGeometry args={[0.4, 0.14, 0.4]} />
          <meshToonMaterial color={bronzeDark} gradientMap={g} />
        </mesh>
      </group>

      {/* plaque on the front of the pedestal */}
      <mesh position={[0, 0.6, 1.0]} rotation={[0, 0, 0]}>
        <planeGeometry args={[0.95, 0.34]} />
        <meshToonMaterial color="#2a2e35" gradientMap={g} />
      </mesh>
      <Text
        position={[0, 0.66, 1.01]}
        fontSize={0.13}
        color="#e8c98f"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
      >
        {PROFILE.name}
      </Text>
      <Text
        position={[0, 0.52, 1.01]}
        fontSize={0.072}
        color="#cdd3de"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.9}
      >
        {PROFILE.role}
      </Text>

      {/* floating label */}
      <Billboard position={[0, 3.3, 0]}>
        <Text
          fontSize={0.34}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#08080a"
        >
          About the Author
        </Text>
      </Billboard>
    </group>
  );
}
