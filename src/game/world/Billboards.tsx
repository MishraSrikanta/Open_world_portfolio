import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { sharedToonGradient } from "../shaders/toon";

/**
 * Roadside "ad" screens — billboards on posts and angled clipboard signs.
 * Posters are drawn to a canvas at runtime (no image assets needed) so they
 * stay crisp and themeable. Each surface fills its whole face and cycles
 * through every poster, swapping to the next one every 5 seconds.
 */

interface Ad {
  /** Short label shown in the editor title bar. */
  tab: string;
  /** The motivational / coding quote, big and readable. */
  quote: string;
  attribution: string;
  /** Accent hue for the chrome + glow. */
  accent: string;
  /** A few lines of fake source to render as the "code image". */
  code: { t: string; c: string }[];
}

// Coding-syntax palette for the faux code snippets.
const KW = "#c792ea"; // keyword
const FN = "#82aaff"; // function / call
const STR = "#c3e88d"; // string
const NUM = "#f78c6c"; // number
const CM = "#5c6370"; // comment
const TXT = "#cdd3de"; // plain

const ADS: Ad[] = [
  {
    tab: "philosophy.ts",
    quote: "Talk is cheap.\nShow me the code.",
    attribution: "— Linus Torvalds",
    accent: "#67e8f9",
    code: [
      { t: "// build things that matter", c: CM },
      { t: "const ship = () => quality++;", c: TXT },
      { t: "while (alive) learn();", c: KW },
    ],
  },
  {
    tab: "craft.js",
    quote: "First, solve the problem.\nThen, write the code.",
    attribution: "— John Johnson",
    accent: "#a78bfa",
    code: [
      { t: "function solve(problem) {", c: FN },
      { t: "  return clarity(problem);", c: STR },
      { t: "}", c: TXT },
    ],
  },
  {
    tab: "simplicity.py",
    quote: "Simplicity is the soul\nof efficiency.",
    attribution: "— Austin Freeman",
    accent: "#c3e88d",
    code: [
      { t: "def design():", c: KW },
      { t: "    return less(noise)", c: FN },
      { t: "    # 0 bugs, 100% intent", c: CM },
    ],
  },
  {
    tab: "growth.rs",
    quote: "Make it work, make it right,\nmake it fast.",
    attribution: "— Kent Beck",
    accent: "#f78c6c",
    code: [
      { t: "let mut skill = 0;", c: KW },
      { t: "loop { skill += 1; }", c: NUM },
      { t: "// compound every day", c: CM },
    ],
  },
  {
    tab: "creativity.glsl",
    quote: "The web is a canvas.\nMake it move.",
    attribution: "— Srikanta Mishra",
    accent: "#5b8def",
    code: [
      { t: "vec3 art = paint(time);", c: FN },
      { t: "gl_FragColor = glow(art);", c: STR },
      { t: "// real-time, 60fps", c: CM },
    ],
  },
];

/** How long each poster stays on screen before the next one swaps in. */
const CYCLE_MS = 5000;

function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

/**
 * Paint a poster as a modern dark code-editor panel: a title bar with traffic
 * lights + filename, a syntax-highlighted snippet (the "coding image"), and a
 * large quote. Laid out in fractions of (w, h) so it fills the surface in both
 * the landscape billboard and portrait clipboard ratios.
 */
function drawPoster(ad: Ad, w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;

  // near-black editor background with a subtle accent glow
  ctx.fillStyle = "#0c0c0f";
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(
    w * 0.8, h * 0.15, 0,
    w * 0.8, h * 0.15, Math.max(w, h) * 0.7
  );
  glow.addColorStop(0, withAlpha(ad.accent, 0.22));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // window border
  ctx.strokeStyle = withAlpha(ad.accent, 0.5);
  ctx.lineWidth = Math.max(2, Math.round(w * 0.006));
  ctx.strokeRect(w * 0.02, h * 0.02, w * 0.96, h * 0.96);

  // title bar
  const barH = h * 0.12;
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(w * 0.02, h * 0.02, w * 0.96, barH);
  const lightR = barH * 0.16;
  ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(w * 0.07 + i * lightR * 3, h * 0.02 + barH / 2, lightR, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `500 ${Math.round(h * 0.05)}px ui-monospace, monospace`;
  ctx.textBaseline = "middle";
  ctx.fillText(ad.tab, w * 0.07 + lightR * 8, h * 0.02 + barH / 2);

  // code snippet (the "coding image")
  const codeX = w * 0.07;
  let codeY = h * 0.2;
  const lineH = h * 0.08;
  ctx.font = `500 ${Math.round(h * 0.052)}px ui-monospace, monospace`;
  ad.code.forEach((ln, i) => {
    // line number gutter
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.fillText(String(i + 1), w * 0.035, codeY);
    ctx.fillStyle = ln.c;
    ctx.fillText(ln.t, codeX, codeY);
    codeY += lineH;
  });

  // divider
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(w * 0.07, h * 0.52);
  ctx.lineTo(w * 0.93, h * 0.52);
  ctx.stroke();

  // big quote (wraps on explicit newlines)
  ctx.fillStyle = "#fafafa";
  ctx.font = `700 ${Math.round(w * 0.072)}px ui-sans-serif, system-ui, sans-serif`;
  const lines = ad.quote.split("\n");
  let qy = h * 0.64;
  const qh = w * 0.082;
  lines.forEach((line) => {
    ctx.fillText(line, w * 0.07, qy);
    qy += qh;
  });

  // attribution
  ctx.fillStyle = withAlpha(ad.accent, 0.9);
  ctx.font = `600 ${Math.round(w * 0.05)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillText(ad.attribution, w * 0.07, h * 0.92);

  return cv;
}

/** One CanvasTexture per ad at the given resolution (built once, cached). */
const texCache = new Map<string, THREE.CanvasTexture[]>();
function posterTextures(w: number, h: number): THREE.CanvasTexture[] {
  const key = `${w}x${h}`;
  let set = texCache.get(key);
  if (!set) {
    set = ADS.map((ad) => {
      const tex = new THREE.CanvasTexture(drawPoster(ad, w, h));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      return tex;
    });
    texCache.set(key, set);
  }
  return set;
}

/** Advances through the ad list every CYCLE_MS, offset by `start`. */
function useCyclingIndex(start: number): number {
  const [idx, setIdx] = useState(start % ADS.length);
  useEffect(() => {
    const id = setInterval(
      () => setIdx((i) => (i + 1) % ADS.length),
      CYCLE_MS
    );
    return () => clearInterval(id);
  }, []);
  return idx;
}

function Billboard({
  position,
  yaw,
  start,
}: {
  position: [number, number, number];
  yaw: number;
  start: number;
}) {
  // landscape face: frame is 4.6 x 3.1 (ratio ~1.5)
  const textures = useMemo(() => posterTextures(512, 342), []);
  const idx = useCyclingIndex(start);
  const g = sharedToonGradient();
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {[-1.6, 1.6].map((x) => (
        <mesh key={x} position={[x, 2.2, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 4.4, 8]} />
          <meshToonMaterial color="#6b4b2a" gradientMap={g} />
        </mesh>
      ))}
      {/* frame */}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[4.6, 3.1, 0.25]} />
        <meshToonMaterial color="#2b2f38" gradientMap={g} />
      </mesh>
      {/* poster fills the whole face */}
      <mesh position={[0, 5, 0.14]}>
        <planeGeometry args={[4.5, 3.0]} />
        <meshBasicMaterial map={textures[idx]} toneMapped={false} />
      </mesh>
      {/* little spotlight above the poster */}
      <mesh position={[0, 6.7, 0.4]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 0.4, 8]} />
        <meshToonMaterial color="#3a3f49" gradientMap={g} />
      </mesh>
    </group>
  );
}

function Clipboard({
  position,
  yaw,
  start,
}: {
  position: [number, number, number];
  yaw: number;
  start: number;
}) {
  // portrait face: board is 1.5 x 2.0 (ratio 0.75)
  const textures = useMemo(() => posterTextures(384, 512), []);
  const idx = useCyclingIndex(start);
  const g = sharedToonGradient();
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 1.2, 6]} />
        <meshToonMaterial color="#7a5a34" gradientMap={g} />
      </mesh>
      {/* angled board, like a clipboard/easel */}
      <group position={[0, 1.5, 0]} rotation={[-0.25, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.5, 2, 0.08]} />
          <meshToonMaterial color="#caa874" gradientMap={g} />
        </mesh>
        {/* poster fills the whole board face */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[1.46, 1.96]} />
          <meshBasicMaterial map={textures[idx]} toneMapped={false} />
        </mesh>
        {/* clip */}
        <mesh position={[0, 1.02, 0.06]}>
          <boxGeometry args={[0.5, 0.16, 0.08]} />
          <meshToonMaterial color="#9aa0a6" gradientMap={g} />
        </mesh>
      </group>
    </group>
  );
}

export function Billboards() {
  return (
    <group>
      <Billboard position={[18, 0, 14]} yaw={-2.3} start={0} />
      <Billboard position={[-16, 0, 18]} yaw={2.3} start={1} />
      <Billboard position={[-18, 0, -16]} yaw={0.9} start={4} />
      <Clipboard position={[9, 0, -9]} yaw={2.4} start={2} />
      <Clipboard position={[-9, 0, 9]} yaw={-0.6} start={3} />
      <Clipboard position={[12, 0, 4]} yaw={-1.6} start={1} />
    </group>
  );
}
