import { create } from "zustand";
import type { SectionId } from "./constants";

export type ControlMode = "player" | "vehicle";

/** Render quality tier. `high` uses the rigged glTF avatar + full post FX;
 * `medium`/`low` swap in the lightweight primitive avatar and trim effects. */
export type Quality = "low" | "medium" | "high";

/**
 * How the world's lighting/time is driven.
 *  - realistic: follows the real wall-clock time in India (IST, UTC+5:30)
 *  - day: pinned to bright noon
 *  - night: pinned to deep night (fireflies + glowing lights)
 */
export type TimeMode = "realistic" | "day" | "night";

export interface InteractTarget {
  id: string;
  label: string; // e.g. "Explore Project"
  verb: string; // e.g. "F"
  kind: "section" | "vehicle" | "npc" | "object";
}

export interface Notification {
  id: number;
  title: string;
  body?: string;
  icon?: string;
}

interface GameState {
  // lifecycle
  ready: boolean;
  loadProgress: number;
  paused: boolean;
  started: boolean;

  // input / device
  isTouch: boolean;
  quality: Quality;

  // gameplay
  controlMode: ControlMode;
  currentArea: SectionId | "junction";
  discovered: Record<string, boolean>;
  interactTarget: InteractTarget | null;
  activeSection: SectionId | null; // section overlay open
  authorOpen: boolean; // "about the author" statue modal open

  // hud
  notifications: Notification[];
  timeOfDay: number; // 0..1, 0 = midnight
  timeMode: TimeMode;

  // actions
  setReady: (v: boolean) => void;
  setProgress: (v: number) => void;
  setPaused: (v: boolean) => void;
  setStarted: (v: boolean) => void;
  setTouch: (v: boolean) => void;
  setQuality: (q: Quality) => void;
  setControlMode: (m: ControlMode) => void;
  setArea: (a: SectionId | "junction") => void;
  setInteractTarget: (t: InteractTarget | null) => void;
  openSection: (s: SectionId | null) => void;
  setAuthorOpen: (v: boolean) => void;
  discover: (id: string, title: string) => void;
  notify: (n: Omit<Notification, "id">) => void;
  dismissNotification: (id: number) => void;
  setTimeOfDay: (t: number) => void;
  setTimeMode: (m: TimeMode) => void;
}

let notifCounter = 1;

export const useGame = create<GameState>((set, get) => ({
  ready: false,
  loadProgress: 0,
  paused: false,
  started: false,

  isTouch: false,
  quality: "medium",

  controlMode: "player",
  currentArea: "junction",
  discovered: {},
  interactTarget: null,
  activeSection: null,
  authorOpen: false,

  notifications: [],
  timeOfDay: 0.32, // start mid-morning
  timeMode: "realistic",

  setReady: (v) => set({ ready: v }),
  setProgress: (v) => set({ loadProgress: v }),
  setPaused: (v) => set({ paused: v }),
  setStarted: (v) => set({ started: v }),
  setTouch: (v) => set({ isTouch: v }),
  setQuality: (q) => set({ quality: q }),
  setControlMode: (m) => set({ controlMode: m }),

  setArea: (a) => {
    if (get().currentArea === a) return;
    set({ currentArea: a });
  },

  setInteractTarget: (t) => {
    const cur = get().interactTarget;
    if (cur?.id === t?.id) return;
    set({ interactTarget: t });
  },

  openSection: (s) => set({ activeSection: s, paused: s !== null }),

  setAuthorOpen: (v) => set({ authorOpen: v, paused: v }),

  discover: (id, title) => {
    if (get().discovered[id]) return;
    set((st) => ({ discovered: { ...st.discovered, [id]: true } }));
    get().notify({ title: "Area Discovered", body: title, icon: "🗺️" });
  },

  notify: (n) =>
    set((st) => ({
      notifications: [...st.notifications, { ...n, id: notifCounter++ }],
    })),

  dismissNotification: (id) =>
    set((st) => ({
      notifications: st.notifications.filter((x) => x.id !== id),
    })),

  setTimeOfDay: (t) => set({ timeOfDay: t }),
  setTimeMode: (m) => set({ timeMode: m }),
}));
