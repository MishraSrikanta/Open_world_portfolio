import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { input, resetFrameDeltas } from "./controls/input";
import { camState } from "./cameraState";
import { playerPos } from "./playerState";
import { CAMERA } from "./constants";

const _target = new THREE.Vector3();
const _desired = new THREE.Vector3();
const _dir = new THREE.Vector3();

/**
 * Smooth third-person orbit camera. Mouse-drag / swipe rotates, wheel / pinch
 * zooms, and a ray from the player to the camera pulls it in when a wall would
 * otherwise clip it. Always frames whatever playerState is following.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const { world, rapier } = useRapier();

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);

    // apply look + zoom from input
    camState.yaw -= input.lookX * CAMERA.rotateSpeed;
    camState.pitch = THREE.MathUtils.clamp(
      camState.pitch + input.lookY * CAMERA.rotateSpeed,
      CAMERA.minPitch,
      CAMERA.maxPitch
    );
    camState.distance = THREE.MathUtils.clamp(
      camState.distance + input.zoom * 0.8,
      CAMERA.minDistance,
      CAMERA.maxDistance
    );
    resetFrameDeltas();

    // target a bit above the player's feet
    _target.copy(playerPos).add(new THREE.Vector3(0, 1.6, 0));

    // spherical offset behind target
    const cp = Math.cos(camState.pitch);
    _dir.set(
      Math.sin(camState.yaw) * cp,
      Math.sin(camState.pitch),
      Math.cos(camState.yaw) * cp
    );
    let dist = camState.distance;

    // camera collision: shorten distance if something is in the way
    const origin = { x: _target.x, y: _target.y, z: _target.z };
    const rayDir = { x: _dir.x, y: _dir.y, z: _dir.z };
    const ray = new rapier.Ray(origin, rayDir);
    const hit = world.castRay(ray, dist, true);
    if (hit && hit.timeOfImpact < dist) {
      dist = Math.max(CAMERA.minDistance * 0.6, hit.timeOfImpact - 0.3);
    }

    _desired.copy(_target).addScaledVector(_dir, dist);

    camera.position.lerp(_desired, Math.min(1, dt * CAMERA.lerp));
    camera.lookAt(_target);
  });

  return null;
}
