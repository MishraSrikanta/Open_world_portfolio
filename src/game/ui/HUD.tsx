"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../store";
import { camState } from "../cameraState";
import { SECTIONS, SECTION_LIST } from "../constants";
import { MiniMap } from "./MiniMap";

/* ------------------------------------------------------------------ */
/* shared panel chrome                                                */
/* ------------------------------------------------------------------ */
const panel =
  "rounded-xl border border-white/10 bg-ink-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md";

/** The single overarching objective shown on the mission panel + map. */
const MISSION_NAME = "Explore every road";

/**
 * Reveals something on mount and again whenever `trigger` changes, then auto-
 * hides it after `holdMs`. Used so the mission panel fades in on load and each
 * time a new section is reached, then fades back out on its own.
 */
function useAutoReveal(trigger: unknown, holdMs = 5000) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const id = setTimeout(() => setVisible(false), holdMs);
    return () => clearTimeout(id);
  }, [trigger, holdMs]);
  return visible;
}

function Compass() {
  const ref = useRef<HTMLDivElement>(null);
  const [heading, setHeading] = useState("N");
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const deg = ((camState.yaw * 180) / Math.PI) % 360;
      if (ref.current) ref.current.style.transform = `rotate(${deg}deg)`;
      const norm = ((deg % 360) + 360) % 360;
      const dirs = ["S", "SW", "W", "NW", "N", "NE", "E", "SE"];
      setHeading(dirs[Math.round(norm / 45) % 8]);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className={`${panel} flex items-center gap-2 px-3 py-1.5`}>
      <div ref={ref} className="relative h-6 w-6">
        <div className="absolute left-1/2 top-0 h-3 w-0.5 -translate-x-1/2 rounded-full bg-red-400" />
        <div className="absolute bottom-0 left-1/2 h-3 w-0.5 -translate-x-1/2 rounded-full bg-white/50" />
      </div>
      <span className="w-7 text-center text-sm font-bold tabular-nums">{heading}</span>
    </div>
  );
}

function Clock() {
  // reflect the world's time-of-day so the clock matches day/night/realistic
  const [t, setT] = useState("--:--");
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const tod = useGame.getState().timeOfDay; // 0..1
      const mins = Math.floor(tod * 1440);
      const hh = Math.floor(mins / 60) % 24;
      const mm = mins % 60;
      setT(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className={`${panel} flex items-center gap-1.5 px-3 py-1.5`}>
      <span className="text-xs">🕒</span>
      <span className="text-sm font-bold tabular-nums">{t}</span>
    </div>
  );
}

function AreaTitle() {
  const area = useGame((s) => s.currentArea);
  const isJunction = area === "junction";
  const label = isJunction ? "Central Junction" : SECTIONS[area].title;
  const subtitle = isJunction ? "Four roads, four stories" : SECTIONS[area].subtitle;
  const color = isJunction ? "#ffffff" : SECTIONS[area].color;
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={area}
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-center"
      >
        <div
          className="font-display text-[26px] font-bold leading-none tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
          style={{ color }}
        >
          {label}
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mx-auto mt-1 h-0.5 w-24 rounded-full"
          style={{ background: color }}
        />
        <div className="mt-1 text-xs font-medium text-white/70">{subtitle}</div>
      </motion.div>
    </AnimatePresence>
  );
}

function InteractionPrompt() {
  const target = useGame((s) => s.interactTarget);
  const isTouch = useGame((s) => s.isTouch);
  const mode = useGame((s) => s.controlMode);
  if (!target) return null;
  if (mode === "vehicle" && target.id === "exit-vehicle" && isTouch) return null;
  const icon =
    target.kind === "section" ? "🚪" : target.kind === "npc" ? "💬" : target.kind === "vehicle" ? "🚗" : "✦";
  return (
    <AnimatePresence>
      <motion.div
        key={target.id}
        initial={{ opacity: 0, y: 18, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2"
      >
        <div className={`${panel} flex items-center gap-2.5 px-4 py-2.5`}>
          <span className="text-lg">{icon}</span>
          {!isTouch && (
            <kbd className="relative rounded-lg border border-white/40 bg-white/20 px-2.5 py-1 text-sm font-extrabold shadow-inner">
              {target.verb}
              <span className="absolute inset-0 -z-10 animate-ping rounded-lg bg-white/20" />
            </kbd>
          )}
          <span className="text-sm font-semibold">{target.label}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Crosshair() {
  const target = useGame((s) => s.interactTarget);
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        animate={{ scale: target ? 1.6 : 1, opacity: target ? 1 : 0.5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-2 w-2 rounded-full bg-white ring-2 ring-black/30"
        style={{ boxShadow: target ? "0 0 10px rgba(255,255,255,0.9)" : "none" }}
      />
    </div>
  );
}

function Notifications() {
  const notifications = useGame((s) => s.notifications);
  const dismiss = useGame((s) => s.dismissNotification);
  useEffect(() => {
    const timers = notifications.map((n) => setTimeout(() => dismiss(n.id), 4200));
    return () => timers.forEach(clearTimeout);
  }, [notifications, dismiss]);
  return (
    <div className="pointer-events-none absolute right-4 top-28 flex w-72 flex-col gap-2">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className={`${panel} relative overflow-hidden p-3 pl-4`}
          >
            <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent to-accent-violet" />
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="text-base">{n.icon ?? "✨"}</span>
              <span>{n.title}</span>
            </div>
            {n.body && <div className="mt-0.5 text-xs text-white/75">{n.body}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ControlsGuide() {
  const isTouch = useGame((s) => s.isTouch);
  const mode = useGame((s) => s.controlMode);
  const [open, setOpen] = useState(true);
  if (isTouch) return null;
  const rows =
    mode === "player"
      ? [
          ["WASD", "Move"],
          ["Shift", "Sprint"],
          ["Space", "Jump"],
          ["F", "Interact"],
          ["E", "Enter Car"],
          ["Drag", "Camera"],
        ]
      : [
          ["W/S", "Throttle"],
          ["A/D", "Steer"],
          ["Space", "Brake"],
          ["H", "Horn"],
          ["E", "Exit Car"],
        ];
  return (
    <div className={`${panel} pointer-events-auto overflow-hidden text-xs`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 px-3 py-2 font-bold uppercase tracking-wide text-white/70 hover:text-white"
      >
        <span>🎮 {mode === "player" ? "On Foot" : "Driving"}</span>
        <span className="text-white/40">{open ? "▾" : "▸"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-2"
          >
            <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-1">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <kbd className="rounded-md border border-white/25 bg-white/10 px-1.5 text-center font-semibold">
                    {k}
                  </kbd>
                  <span className="text-white/80">{v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Objectives() {
  const discovered = useGame((s) => s.discovered);
  const found = SECTION_LIST.filter((s) => discovered[`section-${s.id}`]).length;
  const pct = (found / SECTION_LIST.length) * 100;
  // fade the panel in on load + each time a new section is reached, then out
  const visible = useAutoReveal(found, 5000);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mission"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className={`${panel} w-60 p-3`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-white/60">
              Mission
            </span>
            <span className="text-[11px] font-bold text-accent">
              {found}/{SECTION_LIST.length}
            </span>
          </div>
          <div className="mt-0.5 text-sm font-semibold">{MISSION_NAME}</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent-violet"
              animate={{ width: `${pct}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {SECTION_LIST.map((s) => {
              const done = !!discovered[`section-${s.id}`];
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{ opacity: done ? 1 : 0.45 }}
                >
                  <span
                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px]"
                    style={{ background: done ? s.color : "transparent", border: `1px solid ${s.color}` }}
                  >
                    {done ? "✓" : ""}
                  </span>
                  <span className="truncate">{s.title}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Map with a header showing the mission name and a button to hide/show it. */
function MapPanel() {
  const [open, setOpen] = useState(true);
  return (
    <div className="flex flex-col gap-2">
      <div className={`${panel} flex items-center justify-between gap-2 px-3 py-1.5`}>
        <div className="flex flex-col leading-tight">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
            Mission
          </span>
          <span className="text-xs font-bold">{MISSION_NAME}</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="pointer-events-auto shrink-0 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 hover:bg-white/10"
          title={open ? "Hide map" : "Show map"}
        >
          {open ? "Hide ✕" : "Map 🗺"}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <MiniMap />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TIME_CYCLE = ["realistic", "day", "night"] as const;
const TIME_ICON: Record<(typeof TIME_CYCLE)[number], string> = {
  realistic: "🌗",
  day: "☀️",
  night: "🌙",
};
const TIME_LABEL: Record<(typeof TIME_CYCLE)[number], string> = {
  realistic: "Realistic (India time)",
  day: "Day",
  night: "Night",
};

function TopButtons() {
  const setPaused = useGame((s) => s.setPaused);
  const timeMode = useGame((s) => s.timeMode);
  const setTimeMode = useGame((s) => s.setTimeMode);
  const cycleTime = () => {
    const next = TIME_CYCLE[(TIME_CYCLE.indexOf(timeMode) + 1) % TIME_CYCLE.length];
    setTimeMode(next);
  };
  return (
    <div className="pointer-events-auto flex gap-2">
      <button
        onClick={cycleTime}
        className={`${panel} flex h-9 items-center gap-1.5 px-3 text-base hover:bg-white/20`}
        title={`Time: ${TIME_LABEL[timeMode]} — click to change`}
      >
        <span>{TIME_ICON[timeMode]}</span>
        <span className="text-xs font-bold capitalize">{timeMode}</span>
      </button>
      <button
        onClick={() => setPaused(true)}
        className={`${panel} flex h-9 w-9 items-center justify-center text-base hover:bg-white/20`}
        title="Pause (Esc)"
      >
        ⏸
      </button>
    </div>
  );
}

export function HUD() {
  const started = useGame((s) => s.started);
  const paused = useGame((s) => s.paused);
  const activeSection = useGame((s) => s.activeSection);
  if (!started || paused || activeSection) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 font-game text-white">
      {/* cinematic edge vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35)_100%)]" />

      <AreaTitle />
      <Crosshair />
      <InteractionPrompt />
      <Notifications />

      {/* top-left: map (with mission name + hide toggle) + compass + clock */}
      <div className="absolute left-4 top-4 flex flex-col gap-2">
        <MapPanel />
        <div className="flex gap-2">
          <Compass />
          <Clock />
        </div>
      </div>

      {/* top-right: mission + buttons */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
        <TopButtons />
        <Objectives />
      </div>

      {/* bottom-left: controls */}
      <div className="absolute bottom-4 left-4 w-48">
        <ControlsGuide />
      </div>
    </div>
  );
}
