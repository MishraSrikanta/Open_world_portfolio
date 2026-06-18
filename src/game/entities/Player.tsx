import * as THREE from "three";
import { Suspense, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  RigidBody,
  CapsuleCollider,
  useRapier,
  type RapierRigidBody,
} from "@react-three/rapier";
import { CesiumManModel } from "./CesiumManModel";
import { LowPolyAvatar } from "./Character";
import { input, consume } from "../controls/input";
import { camState } from "../cameraState";
import { playerPos, playerForward, playerVelocity, vehiclePos } from "../playerState";
import { PLAYER, SPAWN_POSITION, SECTION_LIST } from "../constants";
import { useGame } from "../store";

const _tmp = new THREE.Vector3();
const _move = new THREE.Vector3();

export function Player() {
  const body = useRef<RapierRigidBody>(null);
  const visual = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();
  const anim = useRef({ speed: 0, airborne: false });
  const facing = useRef(camState.yaw);
  const ridingPrev = useRef(false);
  const quality = useGame((s) => s.quality);

  useEffect(() => {
    body.current?.setTranslation(
      { x: SPAWN_POSITION.x, y: SPAWN_POSITION.y, z: SPAWN_POSITION.z },
      true
    );
  }, []);

  useFrame((_, dtRaw) => {
    const rb = body.current;
    if (!rb) return;
    const st = useGame.getState();
    const riding = st.controlMode === "vehicle";
    const dt = Math.min(dtRaw, 1 / 30);

    // ---- handle enter/exit transition ----
    if (riding !== ridingPrev.current) {
      ridingPrev.current = riding;
      if (riding) {
        rb.setEnabled(false); // park the body while driving
        if (meshRef.current) meshRef.current.visible = false;
      } else {
        // step out beside the car
        const exit = vehiclePos.clone().add(new THREE.Vector3(2.5, 0.2, 0));
        rb.setEnabled(true);
        rb.setTranslation({ x: exit.x, y: exit.y + 1, z: exit.z }, true);
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        if (meshRef.current) meshRef.current.visible = true;
      }
    }

    if (riding) {
      // camera target = vehicle; nothing else to do on foot
      playerPos.copy(vehiclePos);
      playerVelocity.set(0, 0, 0);
      return;
    }

    const pos = rb.translation();
    playerPos.set(pos.x, pos.y, pos.z);
    const lv = rb.linvel();
    playerVelocity.set(lv.x, 0, lv.z);

    // ---- ground check via short downward ray ----
    const ray = new rapier.Ray(
      { x: pos.x, y: pos.y, z: pos.z },
      { x: 0, y: -1, z: 0 }
    );
    const hit = world.castRay(ray, PLAYER.height + 0.7, true, undefined, undefined, undefined, rb);
    const grounded = !!hit && hit.timeOfImpact < PLAYER.height + 0.55;
    anim.current.airborne = !grounded;

    // ---- camera-relative movement ----
    const yaw = camState.yaw;
    const forward = _tmp.set(Math.sin(yaw), 0, Math.cos(yaw));
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    _move
      .set(0, 0, 0)
      .addScaledVector(forward, -input.moveY)
      .addScaledVector(right, input.moveX);

    const moving = _move.lengthSq() > 0.0001;
    const speed = input.sprint ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const vel = rb.linvel();

    if (moving) {
      _move.normalize();
      rb.setLinvel({ x: _move.x * speed, y: vel.y, z: _move.z * speed }, true);
      facing.current = Math.atan2(_move.x, _move.z);
      playerForward.copy(_move);
    } else {
      rb.setLinvel({ x: vel.x * 0.8, y: vel.y, z: vel.z * 0.8 }, true);
    }

    // ---- jump ----
    if (consume("jump") && grounded) {
      rb.setLinvel({ x: vel.x, y: PLAYER.jumpForce, z: vel.z }, true);
    }

    // ---- smooth facing + anim params ----
    if (visual.current) {
      let diff = facing.current - visual.current.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      visual.current.rotation.y += diff * Math.min(1, dt * PLAYER.turnLerp);
    }
    const horiz = Math.hypot(vel.x, vel.z);
    anim.current.speed = THREE.MathUtils.clamp(horiz / PLAYER.runSpeed, 0, 1);

    // ---- area detection for HUD ----
    let area: (typeof SECTION_LIST)[number]["id"] | "junction" = "junction";
    let nearest = Infinity;
    for (const s of SECTION_LIST) {
      const d = Math.hypot(pos.x - s.position[0], pos.z - s.position[2]);
      if (d < 18 && d < nearest) {
        nearest = d;
        area = s.id;
      }
    }
    if (Math.hypot(pos.x, pos.z) < 13) area = "junction";
    st.setArea(area);
    if (area !== "junction") st.discover(`section-${area}`, SECTION_LIST.find((s) => s.id === area)!.title);
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      mass={1}
      enabledRotations={[false, false, false]}
      position={[SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z]}
      friction={0.2}
      linearDamping={0.4}
      canSleep={false}
    >
      <CapsuleCollider args={[PLAYER.height, PLAYER.radius]} position={[0, PLAYER.height + PLAYER.radius, 0]} />
      <group ref={meshRef}>
        <group ref={visual}>
          {quality === "high" ? (
            <Suspense fallback={null}>
              <CesiumManModel state={anim.current} />
            </Suspense>
          ) : (
            <LowPolyAvatar state={anim.current} />
          )}
        </group>
      </group>
    </RigidBody>
  );
}
