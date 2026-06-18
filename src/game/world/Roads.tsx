import * as THREE from "three";
import { JUNCTION_RADIUS, ROAD_LENGTH, ROAD_WIDTH, SECTION_LIST } from "../constants";
import { sharedToonGradient } from "../shaders/toon";

/**
 * The round central junction plus four roads radiating to each section.
 * Roads are thin boxes laid just above the grass; each carries its section's
 * accent color stripe so paths read at a glance.
 */
export function Roads() {
  return (
    <group position={[0, 0.02, 0]}>
      {/* round junction disc */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[JUNCTION_RADIUS, 48]} />
        <meshToonMaterial color="#b9a98f" gradientMap={sharedToonGradient()} />
      </mesh>
      {/* inner ring accent */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[JUNCTION_RADIUS - 1.2, JUNCTION_RADIUS - 0.6, 48]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {SECTION_LIST.map((s) => {
        const angle = Math.atan2(s.position[0], s.position[2]); // dir from center
        const len = ROAD_LENGTH;
        return (
          <group key={s.id} rotation={[0, angle, 0]}>
            {/* the road slab points toward +Z in local space */}
            <mesh
              position={[0, 0, len / 2 + JUNCTION_RADIUS / 2]}
              rotation={[-Math.PI / 2, 0, 0]}
              receiveShadow
            >
              <planeGeometry args={[ROAD_WIDTH, len]} />
              <meshToonMaterial color="#b3a488" gradientMap={sharedToonGradient()} />
            </mesh>
            {/* center dashed line in the section color */}
            {Array.from({ length: 10 }).map((_, i) => (
              <mesh
                key={i}
                position={[0, 0.012, JUNCTION_RADIUS + 4 + i * (len / 10)]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[0.4, 2.4]} />
                <meshBasicMaterial color={s.color} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
