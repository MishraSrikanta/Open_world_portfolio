import * as THREE from "three";

/**
 * Build a small gradient map that gives MeshToonMaterial its stepped,
 * cel-shaded look. More stops = softer banding.
 */
export function makeToonGradient(steps = 4): THREE.DataTexture {
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    data[i] = Math.round((i / (steps - 1)) * 255);
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Shared gradient so every toon material in the scene matches.
let _gradient: THREE.DataTexture | null = null;
export function sharedToonGradient() {
  if (!_gradient) _gradient = makeToonGradient(4);
  return _gradient;
}

/** Convenience factory for a cel-shaded material. */
export function toonMaterial(
  color: THREE.ColorRepresentation,
  opts: Partial<THREE.MeshToonMaterialParameters> = {}
) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: sharedToonGradient(),
    ...opts,
  });
}
