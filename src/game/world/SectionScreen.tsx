import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { SECTION_LIST, ROAD_LENGTH, type SectionId } from "../constants";
import { sharedToonGradient } from "../shaders/toon";
import { PROFILE, PROJECTS, ROOMS, STORY } from "../content";
import { useGame } from "../store";

/** Compact "TV output" shown on each screen (CSS3D). Display-only; the full
 *  scrollable detail opens via F. */
function ScreenPreview({ id }: { id: SectionId }) {
  if (id === "welcome")
    return (
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-emerald-300">
          {PROFILE.name}
        </div>
        <div className="text-[9px] text-white/60">{PROFILE.role}</div>
        <p className="text-[9px] leading-snug text-white/80">{PROFILE.intro}</p>
        <div className="grid grid-cols-2 gap-1 pt-1">
          {PROFILE.achievements.slice(0, 4).map((a) => (
            <div key={a} className="rounded bg-white/10 px-1.5 py-1 text-[8px]">
              {a}
            </div>
          ))}
        </div>
      </div>
    );
  if (id === "projects")
    return (
      <div className="space-y-1">
        {PROJECTS.slice(0, 4).map((p) => (
          <div key={p.id} className="flex items-center gap-1.5 rounded bg-white/8 px-1.5 py-1">
            <span className="text-sm">{p.emoji}</span>
            <div className="min-w-0">
              <div className="truncate text-[9px] font-bold">{p.name}</div>
              <div className="truncate text-[8px] text-sky-300">{p.stack.slice(0, 3).join(" · ")}</div>
            </div>
          </div>
        ))}
      </div>
    );
  if (id === "about")
    return (
      <div className="grid grid-cols-2 gap-1">
        {ROOMS.map((r) => (
          <div key={r.name} className="rounded bg-white/8 p-1.5">
            <div className="text-[9px] font-bold">
              {r.emoji} {r.name}
            </div>
            <div className="mt-0.5 flex flex-wrap gap-0.5">
              {r.items.slice(0, 3).map((i) => (
                <span key={i} className="rounded bg-amber-400/20 px-1 text-[7px] text-amber-200">
                  {i}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  return (
    <div className="space-y-1">
      {STORY.slice(0, 5).map((c) => (
        <div key={c.year} className="flex items-center gap-1.5">
          <span className="text-xs">{c.emoji}</span>
          <div className="text-[9px]">
            <span className="font-bold text-purple-300">{c.year}</span>
            <span className="text-white/70"> — {c.title}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Tv({
  position,
  yaw,
  id,
  color,
  title,
}: {
  position: [number, number, number];
  yaw: number;
  id: SectionId;
  color: string;
  title: string;
}) {
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame((s) => {
    // subtle screen flicker / glow pulse
    if (screenMat.current)
      screenMat.current.opacity = 0.9 + Math.sin(s.clock.elapsedTime * 6) * 0.04;
  });
  const g = sharedToonGradient();
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      {/* stand */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 2.2, 10]} />
        <meshToonMaterial color="#39414f" gradientMap={g} />
      </mesh>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.12, 16]} />
        <meshToonMaterial color="#2b313c" gradientMap={g} />
      </mesh>
      {/* bezel */}
      <mesh position={[0, 3, 0]} castShadow>
        <boxGeometry args={[4, 2.6, 0.3]} />
        <meshToonMaterial color="#23272f" gradientMap={g} />
      </mesh>
      {/* glowing screen face */}
      <mesh position={[0, 3, 0.16]}>
        <planeGeometry args={[3.7, 2.3]} />
        <meshBasicMaterial ref={screenMat} color={color} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 3, 1]} color={color} intensity={2} distance={8} />

      {/* CSS3D content rendered on the screen surface — sized to the 3.7 x 2.3
          face so it fills edge to edge, with an animated scanline + live dot. */}
      <Html
        transform
        position={[0, 3, 0.18]}
        scale={0.166}
        pointerEvents="none"
        occlude={false}
        wrapperClass="tv-screen"
      >
        <div
          style={{ width: 232, height: 144 }}
          className="relative flex flex-col overflow-hidden rounded-md bg-[#0b1026]/95 p-2 font-game text-white shadow-inner ring-1 ring-white/10"
        >
          <div className="mb-1 flex shrink-0 items-center justify-between">
            <span className="text-[10px] font-extrabold" style={{ color }}>
              {title}
            </span>
            <span className="flex items-center gap-1 rounded bg-white/15 px-1 text-[7px] font-bold">
              <span
                className="tv-live-dot inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: color }}
              />
              F ▶
            </span>
          </div>
          {/* content area grows to fill the remaining screen height */}
          <div className="flex flex-1 flex-col justify-center">
            <ScreenPreview id={id} />
          </div>
          {/* sweeping broadcast scanline */}
          <div className="tv-scan" />
        </div>
      </Html>
    </group>
  );
}

/** A broadcast screen at the end of each road, facing the junction. */
export function SectionScreens() {
  return (
    <>
      {SECTION_LIST.map((s) => {
        const dir = new THREE.Vector3(s.position[0], 0, s.position[2]).normalize();
        // sit just inside the hub, offset to the side of the road
        const along = ROAD_LENGTH - 5;
        const side = new THREE.Vector3(dir.z, 0, -dir.x).multiplyScalar(5);
        const pos: [number, number, number] = [
          dir.x * along + side.x,
          0,
          dir.z * along + side.z,
        ];
        // face back toward the junction so arriving players see the screen
        const yaw = Math.atan2(-dir.x, -dir.z);
        return (
          <Tv
            key={s.id}
            position={pos}
            yaw={yaw}
            id={s.id}
            color={s.color}
            title={s.title}
          />
        );
      })}
    </>
  );
}
