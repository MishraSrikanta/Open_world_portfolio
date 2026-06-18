import { CAMERA } from "./constants";

/** Orbit state owned by the camera rig, read by the player/vehicle so that
 *  movement is always relative to where the camera is looking. */
export const camState = {
  yaw: Math.PI, // looking toward -Z (into the world) at spawn
  pitch: 0.35,
  distance: CAMERA.distance,
};
