import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { sharedToonGradient } from "../shaders/toon";
import { JUNCTION_RADIUS } from "../constants";

/** A single analog clock face whose hands track the real local time. */
function ClockFace({ rotationY }: { rotationY: number }) {
  const hour = useRef<THREE.Group>(null);
  const minute = useRef<THREE.Group>(null);
  const second = useRef<THREE.Group>(null);
  const g = sharedToonGradient();

  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    if (second.current) second.current.rotation.z = -(s / 60) * Math.PI * 2;
    if (minute.current) minute.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (hour.current) hour.current.rotation.z = -(h / 12) * Math.PI * 2;
  });

  return (
    <group rotation={[0, rotationY, 0]}>
      <group position={[0, 0, 0.86]}>
        {/* dial */}
        <mesh>
          <circleGeometry args={[1.15, 32]} />
          <meshToonMaterial color="#f5f0e1" gradientMap={g} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <ringGeometry args={[1.15, 1.3, 32]} />
          <meshToonMaterial color="#3a2c1a" gradientMap={g} />
        </mesh>
        {/* hour ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 0.95, Math.cos(a) * 0.95, 0.02]}
              rotation={[0, 0, -a]}
            >
              <boxGeometry args={[0.06, i % 3 === 0 ? 0.22 : 0.12, 0.02]} />
              <meshBasicMaterial color="#3a2c1a" />
            </mesh>
          );
        })}
        {/* hands (pivot at center, extend upward) */}
        <group ref={hour}>
          <mesh position={[0, 0.28, 0.05]}>
            <boxGeometry args={[0.08, 0.6, 0.02]} />
            <meshBasicMaterial color="#222" />
          </mesh>
        </group>
        <group ref={minute}>
          <mesh position={[0, 0.42, 0.07]}>
            <boxGeometry args={[0.055, 0.9, 0.02]} />
            <meshBasicMaterial color="#222" />
          </mesh>
        </group>
        <group ref={second}>
          <mesh position={[0, 0.46, 0.09]}>
            <boxGeometry args={[0.025, 1.0, 0.02]} />
            <meshBasicMaterial color="#d6453a" toneMapped={false} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.1]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="#222" />
        </mesh>
      </group>
    </group>
  );
}

/** A toon clock tower next to the junction showing the real current time. */
export function ClockTower() {
  const [time, setTime] = useState("--:--:--");
  const g = sharedToonGradient();

  useEffect(() => {
    const update = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // tucked in a junction corner, facing the centre
  const px = JUNCTION_RADIUS + 2;
  const pz = JUNCTION_RADIUS + 2;
  const faceYaw = Math.atan2(-px, -pz); // point the +Z face toward origin

  return (
    <group position={[px, 0, pz]}>
      <RigidBody type="fixed" colliders="cuboid">
        {/* shaft */}
        <mesh position={[0, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 10, 2.6]} />
          <meshToonMaterial color="#e3d6b8" gradientMap={g} />
        </mesh>
      </RigidBody>

      {/* belt where the clock sits */}
      <mesh position={[0, 9.4, 0]} castShadow>
        <boxGeometry args={[3, 2.4, 3]} />
        <meshToonMaterial color="#cdbd97" gradientMap={g} />
      </mesh>
      {/* roof */}
      <mesh position={[0, 11.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.5, 2.4, 4]} />
        <meshToonMaterial color="#9b4a3a" gradientMap={g} />
      </mesh>
      <mesh position={[0, 13.3, 0]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshBasicMaterial color="#ffd34d" toneMapped={false} />
      </mesh>

      {/* clock faces on the two visible sides */}
      <group position={[0, 9.4, 0]}>
        <ClockFace rotationY={faceYaw} />
        <ClockFace rotationY={faceYaw + Math.PI / 2} />
      </group>

      {/* live digital readout above the door, facing the junction */}
      <group rotation={[0, faceYaw, 0]}>
        <Text
          position={[0, 2.6, 1.32]}
          fontSize={0.5}
          color="#fff4cf"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.04}
          outlineColor="#3a2c1a"
        >
          {time}
        </Text>
      </group>
    </group>
  );
}
