import * as THREE from "three";

/** Cardinal sections reachable from the central junction. */
export type SectionId = "welcome" | "projects" | "about" | "story";

export interface SectionDef {
  id: SectionId;
  title: string;
  subtitle: string;
  /** World position of the section hub (where the road ends). */
  position: [number, number, number];
  /** Toon accent color for road / signage / HUD. */
  color: string;
  /** Compass direction label. */
  compass: "N" | "S" | "E" | "W";
}

export const JUNCTION_RADIUS = 10;
export const ROAD_LENGTH = 40;
export const ROAD_WIDTH = 7;
export const WORLD_HALF = 72; // ground half-extent

/**
 * Layout (top-down):
 *                Story (N)
 *                   |
 *  Projects (W) — Junction — About (E)
 *                   |
 *                Welcome (S)
 */
export const SECTIONS: Record<SectionId, SectionDef> = {
  story: {
    id: "story",
    title: "Story & Journey",
    subtitle: "Every road tells part of my story",
    position: [0, 0, -ROAD_LENGTH],
    color: "#c084fc",
    compass: "N",
  },
  about: {
    id: "about",
    title: "About Me",
    subtitle: "A cozy house full of who I am",
    position: [ROAD_LENGTH, 0, 0],
    color: "#fbbf24",
    compass: "E",
  },
  welcome: {
    id: "welcome",
    title: "Welcome",
    subtitle: "Start here — a peaceful park",
    position: [0, 0, ROAD_LENGTH],
    color: "#34d399",
    compass: "S",
  },
  projects: {
    id: "projects",
    title: "Projects",
    subtitle: "A village marketplace of my work",
    position: [-ROAD_LENGTH, 0, 0],
    color: "#38bdf8",
    compass: "W",
  },
};

export const SECTION_LIST = Object.values(SECTIONS);

export const SPAWN_POSITION = new THREE.Vector3(0, 1.2, JUNCTION_RADIUS - 4);

/** Player tuning. */
export const PLAYER = {
  walkSpeed: 4.5,
  runSpeed: 9,
  jumpForce: 7.5,
  radius: 0.45,
  height: 1.1, // capsule half-height (cylinder part)
  turnLerp: 12,
};

/** Camera tuning. */
export const CAMERA = {
  distance: 8,
  minDistance: 4,
  maxDistance: 16,
  height: 3.2,
  lerp: 6,
  rotateSpeed: 0.0042,
  minPitch: -0.35,
  maxPitch: 1.15,
};

/** Vehicle tuning (arcade feel). */
export const VEHICLE = {
  accel: 22,
  maxSpeed: 28,
  reverseSpeed: 10,
  brake: 30,
  steer: 1.9,
  grip: 6,
};

/** A full day/night cycle length in seconds. */
export const DAY_LENGTH = 180;

/** On-screen standing height the high-quality glTF avatar is fitted to. */
export const AVATAR_HEIGHT = 0.5;

/** Standing height of the villager NPCs (top of head). On low/medium quality
 * the lightweight player avatar is fitted to this so the player matches the
 * townsfolk instead of the tiny glTF scale. */
export const NPC_HEIGHT = 1.6;
