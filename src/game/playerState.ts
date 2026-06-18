import * as THREE from "three";

/**
 * Live world transform of whatever the camera is following (player on foot or
 * the vehicle when driving). Written every frame by the active controller and
 * read by the camera, minimap and interaction system — never via React state.
 */
export const playerPos = new THREE.Vector3(0, 1.2, 10);
export const playerForward = new THREE.Vector3(0, 0, 1);

/** Live player velocity (world space), written each frame by the on-foot
 * controller. Read by NPCs to compute knock-down impact. */
export const playerVelocity = new THREE.Vector3();

/** Parked vehicle position, for "enter vehicle" range checks. */
export const vehiclePos = new THREE.Vector3();

/** Live vehicle motion, read by the tire-mark system. */
export const vehicleState = { heading: 0, speed: 0 };
