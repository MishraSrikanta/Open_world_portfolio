"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../store";
import { sfx } from "../audio";
import { PROFILE } from "../content";

export function StartScreen() {
  const started = useGame((s) => s.started);
  const ready = useGame((s) => s.ready);
  const loadProgress = useGame((s) => s.loadProgress);
  const setStarted = useGame((s) => s.setStarted);
  const isTouch = useGame((s) => s.isTouch);

  if (started) return null;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(20,20,28,0.7),rgba(8,8,10,0.95))] p-6 text-center backdrop-blur-[3px]"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-white/60">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          {PROFILE.role}
        </div>
        <div className="font-display text-5xl font-bold tracking-tight drop-shadow-lg sm:text-7xl">
          {PROFILE.name.split(" ")[0]}
          <span className="block bg-gradient-to-r from-accent via-accent-soft to-accent-violet bg-clip-text text-transparent">
            {PROFILE.name.split(" ").slice(1).join(" ") || "Portfolio"}
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/60">
          An explorable open world. Walk or drive the roads to discover my
          projects, story, and skills.
        </p>
      </motion.div>

      <motion.button
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
        disabled={!ready}
        onClick={() => {
          sfx.init();
          setStarted(true);
        }}
        className="mt-9 rounded-full bg-white px-10 py-4 font-display text-base font-bold text-ink-950 shadow-[0_0_40px_-8px_rgba(103,232,249,0.6)] transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
      >
        {ready
          ? "Enter the World  →"
          : `Loading… ${Math.round(loadProgress * 100)}%`}
      </motion.button>

      <a
        href={PROFILE.siteUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 text-xs font-medium text-white/40 underline-offset-4 transition hover:text-accent hover:underline"
      >
        or visit my classic site ↗
      </a>

      <div className="mt-6 text-xs text-white/40">
        {isTouch
          ? "Joystick to move · buttons to act · swipe to look"
          : "WASD move · Shift sprint · Space jump · F interact · E drive · drag to look"}
      </div>
    </motion.div>
  );
}

export function PauseMenu() {
  const paused = useGame((s) => s.paused);
  const started = useGame((s) => s.started);
  const activeSection = useGame((s) => s.activeSection);
  const authorOpen = useGame((s) => s.authorOpen);
  const setPaused = useGame((s) => s.setPaused);
  const quality = useGame((s) => s.quality);
  const setQuality = useGame((s) => s.setQuality);
  const timeMode = useGame((s) => s.timeMode);
  const setTimeMode = useGame((s) => s.setTimeMode);
  const [audioOn, setAudioOn] = useState(true);

  const show = paused && started && !activeSection && !authorOpen;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95 }}
            className="w-80 rounded-2xl border border-white/10 bg-ink-900/95 p-6 text-center shadow-2xl backdrop-blur-md"
          >
            <h2 className="font-display text-2xl font-bold tracking-tight">Paused</h2>

            <button
              onClick={() => setPaused(false)}
              className="mt-5 w-full rounded-full bg-white py-3 font-display font-bold text-ink-950 transition hover:bg-accent-soft"
            >
              Resume
            </button>

            <div className="mt-5 space-y-3 text-left text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Quality</span>
                <div className="flex gap-1">
                  {(["low", "medium", "high"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuality(q)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${
                        quality === q
                          ? "bg-accent text-ink-950"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Time</span>
                <div className="flex gap-1">
                  {(
                    [
                      ["realistic", "Auto"],
                      ["day", "Day"],
                      ["night", "Night"],
                    ] as const
                  ).map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => setTimeMode(m)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        timeMode === m
                          ? "bg-accent text-ink-950"
                          : "bg-white/10 text-white/70"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Sound</span>
                <button
                  onClick={() => {
                    const v = !audioOn;
                    setAudioOn(v);
                    sfx.toggle(v);
                  }}
                  className={`rounded-lg px-3 py-1 font-semibold ${
                    audioOn ? "bg-accent text-ink-950" : "bg-white/10"
                  }`}
                >
                  {audioOn ? "On" : "Off"}
                </button>
              </div>
            </div>

            <p className="mt-5 text-xs text-white/40">Press Esc to resume</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
