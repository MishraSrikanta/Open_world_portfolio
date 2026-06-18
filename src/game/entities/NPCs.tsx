import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Text } from "@react-three/drei";
import { sharedToonGradient } from "../shaders/toon";
import { registerInteractable } from "../interactables";
import { useGame } from "../store";
import { playerPos, playerVelocity } from "../playerState";

interface NpcDef {
  id: string;
  name: string;
  color: string;
  lines: string[];
  path: [number, number][]; // xz waypoints to patrol
  speed: number;
}

const NPCS: NpcDef[] = [
  {
    id: "mara",
    name: "Mara",
    color: "#e07a5f",
    speed: 1.6,
    lines: [
      "Hello! Welcome to the world.",
      "Head north for the Story road — it's my favorite.",
      "Press F near the glowing rings to explore a section!",
    ],
    path: [
      [12, 12],
      [20, 6],
      [16, -6],
      [8, -2],
    ],
  },
  {
    id: "kobi",
    name: "Kobi",
    color: "#3d9970",
    speed: 1.3,
    lines: [
      "There's a car parked nearby — press E to drive it.",
      "The Projects village is west. Each shop is a real project!",
    ],
    path: [
      [-14, 10],
      [-22, 2],
      [-16, -8],
      [-6, -4],
    ],
  },
  {
    id: "iris",
    name: "Iris",
    color: "#9b5de5",
    speed: 1.1,
    lines: [
      "I love watching the sunset from the fountain.",
      "Stick around — the world has a full day & night cycle.",
    ],
    path: [
      [4, -16],
      [-4, -22],
      [-2, -12],
      [6, -10],
    ],
  },
];

// fall axis is reused each frame; kept module-level to avoid per-frame allocs
const _fallAxis = new THREE.Vector3();

function Villager({ def }: { def: NpcDef }) {
  const ref = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const visual = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const pos = useRef(new THREE.Vector3(def.path[0][0], 0, def.path[0][1]));
  const seg = useRef(0);
  const lineIdx = useRef(0);
  const g = sharedToonGradient();

  /** Knock-down state. `down` while falling/lying, `timer` counts toward
   * standing up, `tiltAmt` is the eased 0..1 lie-flat amount, `fallDir` is the
   * horizontal direction the body tips toward, `cooldown` blocks re-hits just
   * after standing. */
  const knock = useRef({
    down: false,
    timer: 0,
    tiltAmt: 0,
    fallDir: new THREE.Vector3(0, 0, 1),
    cooldown: 0,
  });

  useEffect(() => {
    return registerInteractable({
      id: `npc-${def.id}`,
      label: `Talk to ${def.name}`,
      kind: "npc",
      range: 3,
      channel: "interact",
      getPosition: () => pos.current,
      onInteract: () => {
        const line = def.lines[lineIdx.current % def.lines.length];
        lineIdx.current++;
        useGame.getState().notify({ title: def.name, body: line, icon: "💬" });
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((s, dtRaw) => {
    const dt = Math.min(dtRaw, 1 / 30);
    const k = knock.current;

    // ---- collision with the player ----
    if (k.cooldown > 0) k.cooldown -= dt;
    const dx = pos.current.x - playerPos.x;
    const dz = pos.current.z - playerPos.z;
    const planar = Math.hypot(dx, dz);
    const impact = playerVelocity.length();
    if (!k.down && k.cooldown <= 0 && planar < 1.0 && impact > 1.5) {
      // knocked over: fall away from the player, harder hits stay down longer
      k.down = true;
      const f = Math.min(impact / 9, 1); // 0..1 relative to run speed
      k.timer = 1.6 + f * 2.2;
      k.fallDir.set(dx, 0, dz);
      if (k.fallDir.lengthSq() < 1e-4) k.fallDir.set(0, 0, 1);
      k.fallDir.normalize();
      // shove the body in the fall direction proportional to the impact
      pos.current.addScaledVector(k.fallDir, 0.3 + f * 0.9);
    }

    if (k.down) {
      // tip over fast, lie flat, then count toward standing up
      k.timer -= dt;
      if (k.timer > 0.5) {
        k.tiltAmt += (1 - k.tiltAmt) * Math.min(1, dt * 8);
      } else {
        // standing back up
        k.tiltAmt += (0 - k.tiltAmt) * Math.min(1, dt * 5);
        if (k.timer <= 0 && k.tiltAmt < 0.05) {
          k.down = false;
          k.tiltAmt = 0;
          k.cooldown = 1.2;
        }
      }
    } else {
      // ---- normal patrol ----
      const target = def.path[seg.current];
      const tv = new THREE.Vector3(target[0], 0, target[1]);
      const dir = tv.clone().sub(pos.current);
      const dist = dir.length();
      if (dist < 0.3) {
        seg.current = (seg.current + 1) % def.path.length;
      } else {
        dir.normalize();
        pos.current.addScaledVector(dir, def.speed * dt);
        if (visual.current) {
          const yaw = Math.atan2(dir.x, dir.z);
          let diff = yaw - visual.current.rotation.y;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          visual.current.rotation.y += diff * Math.min(1, dt * 6);
        }
      }
    }

    if (ref.current) ref.current.position.copy(pos.current);

    // apply the fall tilt around a horizontal axis perpendicular to fallDir
    if (tilt.current) {
      _fallAxis.set(k.fallDir.z, 0, -k.fallDir.x);
      tilt.current.quaternion.setFromAxisAngle(_fallAxis, k.tiltAmt * (Math.PI / 2));
    }

    // legs stay still while down, swing while walking
    const swing = k.down ? 0 : Math.sin(s.clock.elapsedTime * 7) * 0.5;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
  });

  return (
    <group ref={ref}>
      <group ref={tilt}>
      <group ref={visual}>
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[0.5, 0.65, 0.32]} />
          <meshToonMaterial color={def.color} gradientMap={g} />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshToonMaterial color="#f0c39a" gradientMap={g} />
        </mesh>
        <group ref={legL} position={[-0.13, 0.55, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <boxGeometry args={[0.16, 0.55, 0.16]} />
            <meshToonMaterial color="#33405c" gradientMap={g} />
          </mesh>
        </group>
        <group ref={legR} position={[0.13, 0.55, 0]}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <boxGeometry args={[0.16, 0.55, 0.16]} />
            <meshToonMaterial color="#33405c" gradientMap={g} />
          </mesh>
        </group>
      </group>
      </group>
      <Billboard position={[0, 2, 0]}>
        <Text fontSize={0.3} color="#fff" outlineWidth={0.03} outlineColor="#0b1026">
          {def.name}
        </Text>
      </Billboard>
    </group>
  );
}

/** A little dog that trots in a circle near the campfire. */
function Dog() {
  const ref = useRef<THREE.Group>(null);
  const g = sharedToonGradient();
  useFrame((s) => {
    const t = s.clock.elapsedTime * 0.6;
    if (ref.current) {
      ref.current.position.set(24 + Math.cos(t) * 4, 0, 22 + Math.sin(t) * 4);
      ref.current.rotation.y = -t + Math.PI / 2;
    }
  });
  return (
    <group ref={ref}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.8]} />
        <meshToonMaterial color="#b97a3c" gradientMap={g} />
      </mesh>
      <mesh position={[0, 0.55, 0.45]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshToonMaterial color="#caa05c" gradientMap={g} />
      </mesh>
    </group>
  );
}

export function NPCs() {
  const villagers = useMemo(() => NPCS, []);
  return (
    <group>
      {villagers.map((n) => (
        <Villager key={n.id} def={n} />
      ))}
      <Dog />
    </group>
  );
}
