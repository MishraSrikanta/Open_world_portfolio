import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "../store";

/**
 * Cartoon gradient sky dome. Top/bottom colors are driven by time-of-day so
 * the whole sky shifts from dawn → noon → dusk → night. Rendered on the
 * inside of a large sphere; unaffected by lighting (basic material).
 */
const TOP = {
  day: new THREE.Color("#3FA9F5"),
  dusk: new THREE.Color("#27406b"),
  night: new THREE.Color("#070b1f"),
};
const BOT = {
  day: new THREE.Color("#cde6ff"),
  dusk: new THREE.Color("#f7b267"),
  night: new THREE.Color("#10183a"),
};

export function SkyDome() {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uBottom: { value: new THREE.Color() },
    }),
    []
  );

  useFrame(() => {
    const t = useGame.getState().timeOfDay; // 0..1
    // map time to a "sun height" 0(night)..1(noon)
    const day = Math.sin(t * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5; // 0..1
    const top = uniforms.uTop.value;
    const bot = uniforms.uBottom.value;
    if (day > 0.5) {
      const k = (day - 0.5) / 0.5;
      top.copy(TOP.dusk).lerp(TOP.day, k);
      bot.copy(BOT.dusk).lerp(BOT.day, k);
    } else {
      const k = day / 0.5;
      top.copy(TOP.night).lerp(TOP.dusk, k);
      bot.copy(BOT.night).lerp(BOT.dusk, k);
    }
  });

  return (
    <mesh scale={[-1, 1, 1]} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[480, 24, 16]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        depthWrite={false}
        side={THREE.BackSide}
        vertexShader={/* glsl */ `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          varying vec3 vPos;
          void main() {
            float h = clamp(vPos.y / 480.0 * 0.5 + 0.5, 0.0, 1.0);
            vec3 col = mix(uBottom, uTop, pow(h, 0.7));
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
}
