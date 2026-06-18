import * as THREE from "three";
import { sharedToonGradient } from "./toon";

/**
 * Toon grass material with vertex-driven wind. Tips bend more than roots
 * (weighted by local Y in the blade geometry, which spans 0..1).
 * Designed for InstancedMesh; sways using world position + time.
 */
export function createGrassMaterial(): THREE.MeshToonMaterial {
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color("#6db83f"),
    gradientMap: sharedToonGradient(),
    side: THREE.DoubleSide,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uWind = { value: 0.35 };
    (mat as unknown as { userData: { shader: THREE.WebGLProgramParametersWithUniforms } }).userData.shader = shader;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uTime;
         uniform float uWind;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
         #ifdef USE_INSTANCING
           vec4 wp = instanceMatrix * vec4(0.0,0.0,0.0,1.0);
         #else
           vec4 wp = vec4(0.0);
         #endif
         float bend = pow(clamp(position.y, 0.0, 1.0), 1.5);
         float phase = wp.x * 0.6 + wp.z * 0.6 + uTime * 1.8;
         transformed.x += sin(phase) * uWind * bend;
         transformed.z += cos(phase * 0.7) * uWind * 0.5 * bend;`
      );
  };

  return mat;
}

/** Update wind animation for a grass material created above. */
export function tickGrass(mat: THREE.MeshToonMaterial, time: number) {
  const shader = (mat as unknown as { userData: { shader?: THREE.WebGLProgramParametersWithUniforms } })
    .userData.shader;
  if (shader) shader.uniforms.uTime.value = time;
}
