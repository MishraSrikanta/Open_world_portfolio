import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

/**
 * Stylized toon-ish water: animated gerstner-lite ripples + fresnel rim +
 * two-tone color band. Cheap, no reflections — fits the cartoon art style.
 */
export const StylizedWaterMaterial = shaderMaterial(
  {
    uTime: 0,
    uShallow: new THREE.Color("#7fe3e0"),
    uDeep: new THREE.Color("#2f8fce"),
    uFoam: new THREE.Color("#ffffff"),
  },
  // vertex
  /* glsl */ `
    uniform float uTime;
    varying vec3 vNormalW;
    varying float vWave;
    void main() {
      vec3 p = position;
      float w =
        sin(p.x * 0.5 + uTime * 1.2) * 0.12 +
        cos(p.y * 0.6 + uTime * 1.6) * 0.10;
      p.z += w;
      vWave = w;
      vNormalW = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `,
  // fragment
  /* glsl */ `
    uniform float uTime;
    uniform vec3 uShallow;
    uniform vec3 uDeep;
    uniform vec3 uFoam;
    varying vec3 vNormalW;
    varying float vWave;
    void main() {
      float band = smoothstep(-0.12, 0.12, vWave);
      vec3 col = mix(uDeep, uShallow, band);
      // toon foam crests
      float foam = smoothstep(0.16, 0.2, vWave);
      col = mix(col, uFoam, foam * 0.8);
      // soft fresnel rim
      float fres = pow(1.0 - abs(vNormalW.z), 2.0);
      col += fres * 0.15;
      gl_FragColor = vec4(col, 0.86);
    }
  `
);

extend({ StylizedWaterMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    stylizedWaterMaterial: {
      ref?: React.Ref<THREE.ShaderMaterial & { uTime: number }>;
      transparent?: boolean;
      attach?: string;
      key?: React.Key;
    };
  }
}
