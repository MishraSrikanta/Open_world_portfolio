import * as THREE from "three";
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";
import { sharedToonGradient } from "../shaders/toon";
import { playerPos } from "../playerState";
import { useGame } from "../store";

const SEA_CENTER = new THREE.Vector3(46, 0, 46);
const SEA_RADIUS = 18;
const BEACH_RADIUS = 23;
const SEA_LEVEL = 0.12;

/** Stylized sea: layered sine waves + animated toon foam at the shoreline. */
const SeaMaterial = shaderMaterial(
  {
    uTime: 0,
    uDeep: new THREE.Color("#0c3f63"),
    uShallow: new THREE.Color("#36c2e6"),
    uFoam: new THREE.Color("#ffffff"),
    uSky: new THREE.Color("#bdeeff"),
    uRadius: SEA_RADIUS,
  },
  /* glsl */ `
    uniform float uTime;
    varying float vWave;
    varying float vEdge;
    varying float vDepth;
    varying vec3 vNormal;
    varying vec3 vView;

    // layered swell — returns height at (x, y)
    float wave(vec2 q, float t) {
      return
        sin(q.x * 0.45 + t * 1.3) * 0.18 +
        cos(q.y * 0.5 + t * 1.7) * 0.15 +
        sin((q.x + q.y) * 0.3 + t * 0.9) * 0.12 +
        sin((q.x - q.y) * 0.8 + t * 2.4) * 0.05;
    }

    void main() {
      vec3 p = position; // circle in local XY, z is up before the -90deg rotation
      float d = length(p.xy);
      float w = wave(p.xy, uTime);
      p.z += w;
      vWave = w;
      vDepth = clamp(d / uRadius, 0.0, 1.0);
      vEdge = smoothstep(uRadius - 3.0, uRadius, d); // 0 inside .. 1 at shore

      // analytic normal from finite differences of the wave field
      float e = 0.35;
      float wx = wave(p.xy + vec2(e, 0.0), uTime) - wave(p.xy - vec2(e, 0.0), uTime);
      float wy = wave(p.xy + vec2(0.0, e), uTime) - wave(p.xy - vec2(0.0, e), uTime);
      vNormal = normalize(vec3(-wx, -wy, 2.0 * e));

      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vView = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }
  `,
  /* glsl */ `
    uniform vec3 uDeep;
    uniform vec3 uShallow;
    uniform vec3 uFoam;
    uniform vec3 uSky;
    uniform float uTime;
    varying float vWave;
    varying float vEdge;
    varying float vDepth;
    varying vec3 vNormal;
    varying vec3 vView;

    void main() {
      // depth-based base gradient (brighter in the shallows near shore)
      vec3 col = mix(uShallow, uDeep, smoothstep(0.0, 1.0, vDepth));
      // wave-band shading for a layered toon look
      float band = smoothstep(-0.2, 0.2, vWave);
      col = mix(col * 0.82, col * 1.12, band);

      // fresnel sky reflection at grazing angles
      float fres = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.0);
      col = mix(col, uSky, fres * 0.5);

      // sun glints on the up-facing wave facets
      vec3 sun = normalize(vec3(0.4, 0.85, 0.3));
      float spec = pow(max(dot(reflect(-sun, vNormal), vView), 0.0), 60.0);
      float sparkle = step(0.6, fract(sin(dot(floor((vView.xy + vWave) * 30.0), vec2(12.99, 78.23))) * 43758.5));
      col += spec * (0.6 + 0.4 * sparkle);

      // crest foam + animated shoreline foam ring
      float crest = smoothstep(0.24, 0.32, vWave);
      float shore = vEdge * (0.55 + 0.45 * sin(uTime * 4.0 + vEdge * 22.0));
      col = mix(col, uFoam, clamp(crest + shore, 0.0, 1.0) * 0.85);

      gl_FragColor = vec4(col, 0.94);
    }
  `
);
extend({ SeaMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    seaMaterial: {
      ref?: React.Ref<THREE.ShaderMaterial & { uTime: number }>;
      transparent?: boolean;
      key?: React.Key;
    };
  }
}

const RIPPLES = 14;

/** Expanding ring ripples spawned where the player wades into the sea. */
function Ripples() {
  const group = useRef<THREE.Group>(null);
  const pool = useRef(
    Array.from({ length: RIPPLES }, () => ({
      mesh: null as THREE.Mesh | null,
      t: 1, // 1 = inactive
      x: 0,
      z: 0,
    }))
  );
  const next = useRef(0);
  const last = useRef(new THREE.Vector3());
  const acc = useRef(0);

  useFrame((_, dt) => {
    const list = pool.current;

    // emit when the followed character is in the water and moving
    const p = playerPos;
    const inWater =
      Math.hypot(p.x - SEA_CENTER.x, p.z - SEA_CENTER.z) < SEA_RADIUS - 0.5;
    const moved = p.distanceTo(last.current);
    last.current.copy(p);
    acc.current += dt;
    if (inWater && moved > 0.05 && acc.current > 0.18) {
      acc.current = 0;
      const r = list[next.current % RIPPLES];
      next.current++;
      r.t = 0;
      r.x = p.x - SEA_CENTER.x; // local to the sea group
      r.z = p.z - SEA_CENTER.z;
    }

    // advance ripples
    for (const r of list) {
      if (!r.mesh) continue;
      if (r.t >= 1) {
        r.mesh.visible = false;
        continue;
      }
      r.t = Math.min(r.t + dt * 0.9, 1);
      const s = 0.4 + r.t * 3.2;
      r.mesh.visible = true;
      r.mesh.position.set(r.x, SEA_LEVEL + 0.05, r.z);
      r.mesh.scale.setScalar(s);
      const m = r.mesh.material as THREE.MeshBasicMaterial;
      m.opacity = (1 - r.t) * 0.6;
    }
  });

  return (
    <group ref={group}>
      {pool.current.map((r, i) => (
        <mesh
          key={i}
          ref={(m) => {
            if (m) pool.current[i].mesh = m;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.7, 1, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** The sea, its sandy beach ring, and the interactive ripple system. */
export function Sea() {
  const matRef = useRef<THREE.ShaderMaterial & { uTime: number }>(null);
  const quality = useGame((s) => s.quality);
  const segments = quality === "high" ? 96 : 48;
  const g = sharedToonGradient();

  const waterGeom = useMemo(() => {
    const geo = new THREE.CircleGeometry(SEA_RADIUS, segments);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [segments]);

  useFrame((s) => {
    if (matRef.current) matRef.current.uTime = s.clock.elapsedTime;
  });

  return (
    <group position={[SEA_CENTER.x, 0, SEA_CENTER.z]}>
      {/* sandy beach ring under the waterline */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[BEACH_RADIUS, 48]} />
        <meshToonMaterial color="#e7d3a1" gradientMap={g} />
      </mesh>
      {/* darker wet sand near the water */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SEA_RADIUS - 1, SEA_RADIUS + 1.5, 48]} />
        <meshToonMaterial color="#c9b07a" gradientMap={g} />
      </mesh>
      {/* animated water */}
      <mesh geometry={waterGeom} position={[0, SEA_LEVEL, 0]}>
        <seaMaterial ref={matRef} transparent />
      </mesh>
      <Ripples />
    </group>
  );
}
