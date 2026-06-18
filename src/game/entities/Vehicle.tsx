import * as THREE from "three";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, type RapierRigidBody } from "@react-three/rapier";
import { sharedToonGradient } from "../shaders/toon";
import { input, consume } from "../controls/input";
import { camState } from "../cameraState";
import { vehiclePos, vehicleState } from "../playerState";
import { VEHICLE, JUNCTION_RADIUS } from "../constants";
import { registerInteractable } from "../interactables";
import { useGame } from "../store";
import { sfx } from "../audio";

const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

/** Arcade cartoon car: accelerate, brake, reverse, steer, headlights, horn. */
export function Vehicle() {
  const body = useRef<RapierRigidBody>(null);
  const wheels = useRef<THREE.Mesh[]>([]);
  const headlightL = useRef<THREE.SpotLight>(null);
  const headlightR = useRef<THREE.SpotLight>(null);
  const speed = useRef(0);
  const heading = useRef(0);
  const start: [number, number, number] = [10, 0.6, -2];

  useEffect(() => {
    return registerInteractable({
      id: "car",
      label: "Enter Car",
      kind: "vehicle",
      range: 4,
      channel: "vehicle",
      getPosition: () => vehiclePos,
      onInteract: () => {
        if (useGame.getState().controlMode === "player") {
          camState.yaw = heading.current + Math.PI;
          useGame.getState().setControlMode("vehicle");
          useGame.getState().notify({ title: "Now Driving", body: "WASD to drive · E to exit", icon: "🚗" });
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((state, dtRaw) => {
    const rb = body.current;
    if (!rb) return;
    const dt = Math.min(dtRaw, 1 / 30);
    const st = useGame.getState();
    const riding = st.controlMode === "vehicle";

    const t = rb.translation();
    vehiclePos.set(t.x, t.y, t.z);
    vehicleState.heading = heading.current;
    vehicleState.speed = speed.current;

    // headlights at night
    const night = (() => {
      const tod = st.timeOfDay;
      const day = Math.sin(tod * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
      return THREE.MathUtils.clamp((0.35 - day) / 0.2, 0, 1);
    })();
    const hl = night * (riding ? 1 : 0.5) * 8;
    if (headlightL.current) headlightL.current.intensity = hl;
    if (headlightR.current) headlightR.current.intensity = hl;

    if (riding) {
      const throttle = input.moveY; // forward/back
      const steerIn = input.moveX;

      if (input.brake) {
        speed.current = THREE.MathUtils.damp(speed.current, 0, VEHICLE.brake * 0.3, dt);
      } else if (throttle > 0.05) {
        speed.current = THREE.MathUtils.damp(speed.current, VEHICLE.maxSpeed, 2.5, dt);
      } else if (throttle < -0.05) {
        speed.current = THREE.MathUtils.damp(speed.current, -VEHICLE.reverseSpeed, 2.5, dt);
      } else {
        speed.current = THREE.MathUtils.damp(speed.current, 0, 1.2, dt);
      }

      // steering scales with speed; reversed when going backwards
      const speedFactor = THREE.MathUtils.clamp(Math.abs(speed.current) / 6, 0, 1);
      heading.current -= steerIn * VEHICLE.steer * dt * speedFactor * Math.sign(speed.current || 1);

      _q.setFromAxisAngle(_up, heading.current);
      rb.setRotation(_q, true);

      const fwd = new THREE.Vector3(Math.sin(heading.current), 0, Math.cos(heading.current));
      const vy = rb.linvel().y;
      rb.setLinvel({ x: fwd.x * speed.current, y: vy, z: fwd.z * speed.current }, true);

      // engine + horn audio
      sfx.engine(Math.abs(speed.current) / VEHICLE.maxSpeed);
      if (input.horn) sfx.horn();

      if (consume("enterVehicle")) {
        st.setControlMode("player");
        sfx.engine(0);
        st.notify({ title: "On Foot", body: "Car parked here", icon: "🚶" });
      }
    } else {
      // idle: bleed any residual motion so the parked car settles
      speed.current *= 0.9;
      sfx.engine(0);
    }

    // spin wheels relative to speed
    const spin = speed.current * dt * 1.4;
    wheels.current.forEach((w) => w && (w.rotation.x += spin));
  });

  const g = sharedToonGradient();
  const wheelPositions: [number, number, number][] = [
    [-0.95, -0.1, 1.3],
    [0.95, -0.1, 1.3],
    [-0.95, -0.1, -1.3],
    [0.95, -0.1, -1.3],
  ];

  return (
    <RigidBody
      ref={body}
      colliders="cuboid"
      ccd
      mass={3}
      position={start}
      enabledRotations={[false, true, false]}
      linearDamping={0.6}
      angularDamping={4}
      canSleep={false}
    >
      {/* body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[2, 0.7, 4]} />
        <meshToonMaterial color="#e2483d" gradientMap={g} />
      </mesh>
      {/* cabin */}
      <mesh position={[0, 0.95, -0.2]} castShadow>
        <boxGeometry args={[1.7, 0.7, 2]} />
        <meshToonMaterial color="#b8362d" gradientMap={g} />
      </mesh>
      {/* windshield */}
      <mesh position={[0, 0.98, 0.85]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[1.5, 0.6, 0.08]} />
        <meshToonMaterial color="#bfe6ff" gradientMap={g} />
      </mesh>
      {/* headlights */}
      <mesh position={[-0.6, 0.45, 2.01]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshBasicMaterial color="#fff3c4" toneMapped={false} />
      </mesh>
      <mesh position={[0.6, 0.45, 2.01]}>
        <boxGeometry args={[0.3, 0.2, 0.05]} />
        <meshBasicMaterial color="#fff3c4" toneMapped={false} />
      </mesh>
      <spotLight
        ref={headlightL}
        position={[-0.6, 0.5, 2]}
        target-position={[-0.6, -1, 10]}
        angle={0.6}
        penumbra={0.5}
        color="#fff4d0"
        distance={26}
        intensity={0}
      />
      <spotLight
        ref={headlightR}
        position={[0.6, 0.5, 2]}
        target-position={[0.6, -1, 10]}
        angle={0.6}
        penumbra={0.5}
        color="#fff4d0"
        distance={26}
        intensity={0}
      />
      {/* wheels */}
      {wheelPositions.map((p, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) wheels.current[i] = m;
          }}
          position={p}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.45, 0.45, 0.35, 14]} />
          <meshToonMaterial color="#21262e" gradientMap={g} />
        </mesh>
      ))}
    </RigidBody>
  );
}
