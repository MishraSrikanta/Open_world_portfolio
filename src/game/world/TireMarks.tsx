import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "../store";
import { vehiclePos, vehicleState } from "../playerState";

const POOL = 300; // ring buffer; oldest marks recycle as you drive on
const REAR = 1.3; // distance from car centre to rear axle
const TRACK = 0.95; // half the wheel spacing
const STEP = 0.55; // distance between dropped marks

const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _p = new THREE.Vector3();
const _qFlat = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2
);
const _qYaw = new THREE.Quaternion();
const _q = new THREE.Quaternion();

/**
 * Leaves dark tire marks on the ground while driving. Marks are a single
 * InstancedMesh used as a ring buffer, so memory is fixed and old marks fade
 * out as the buffer wraps. Emits faster the harder you accelerate/drift.
 */
export function TireMarks() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const idx = useRef(0);
  const last = useRef(new THREE.Vector3(9999, 0, 9999));
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const st = useGame.getState();
    if (st.controlMode !== "vehicle" || Math.abs(vehicleState.speed) < 5) return;

    const moved = vehiclePos.distanceTo(last.current);
    if (moved < STEP) return;
    last.current.copy(vehiclePos);

    const h = vehicleState.heading;
    _fwd.set(Math.sin(h), 0, Math.cos(h));
    _right.set(_fwd.z, 0, -_fwd.x);
    _qYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), h);
    _q.copy(_qYaw).multiply(_qFlat);

    for (const sgn of [-1, 1] as const) {
      _p.copy(vehiclePos)
        .addScaledVector(_fwd, -REAR)
        .addScaledVector(_right, sgn * TRACK);
      dummy.position.set(_p.x, 0.04, _p.z);
      dummy.quaternion.copy(_q);
      dummy.scale.set(0.32, 0.85, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(idx.current % POOL, dummy.matrix);
      idx.current++;
    }
    mesh.count = Math.min(idx.current, POOL);
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, POOL]} frustumCulled={false} renderOrder={1}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color="#15130f"
        transparent
        opacity={0.5}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </instancedMesh>
  );
}
