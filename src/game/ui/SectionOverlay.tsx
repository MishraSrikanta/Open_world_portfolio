"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../store";
import { SECTIONS, type SectionId } from "../constants";
import { PROFILE, PROJECTS, ROOMS, STORY } from "../content";

function Welcome() {
  return (
    <div className="space-y-5">
      <p className="text-lg text-white/85">{PROFILE.intro}</p>
      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          {PROFILE.name} · {PROFILE.role}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {PROFILE.achievements.map((a) => (
            <div
              key={a}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
            >
              {a}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={PROFILE.resumeUrl}
          className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display font-bold text-ink-950 transition hover:bg-accent-soft"
          download
        >
          ⬇ Download Résumé
        </a>
        <a
          href={PROFILE.siteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-display font-semibold text-white transition hover:border-accent hover:text-accent"
        >
          Visit my site ↗
        </a>
      </div>
    </div>
  );
}

function Projects() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {PROJECTS.map((p) => (
        <motion.div
          key={p.id}
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-accent/40"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{p.emoji}</span>
            <div>
              <div className="font-display font-bold">{p.name}</div>
              <div className="text-xs text-accent">{p.shop}</div>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/70">{p.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {p.stack.map((s) => (
              <span
                key={s}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-accent-soft"
              >
                {s}
              </span>
            ))}
          </div>
          <ul className="mt-2 space-y-0.5 text-xs text-white/60">
            {p.features.map((f) => (
              <li key={f}>• {f}</li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            {p.github && (
              <a
                href={p.github}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
              >
                GitHub
              </a>
            )}
            {p.demo && (
              <a
                href={p.demo}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-ink-950 hover:bg-accent-soft"
              >
                Live Demo
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function About() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {ROOMS.map((r) => (
        <div key={r.name} className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-2xl">{r.emoji}</span>
            {r.name}
          </div>
          <p className="mt-1 text-sm text-white/75">{r.body}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {r.items.map((i) => (
              <span
                key={i}
                className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] text-amber-200"
              >
                {i}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Story() {
  return (
    <div className="relative space-y-4 pl-6">
      <div className="absolute bottom-2 left-2 top-2 w-0.5 bg-purple-400/40" />
      {STORY.map((c, i) => (
        <motion.div
          key={c.year}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="relative"
        >
          <div className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full bg-purple-400 ring-4 ring-purple-400/20" />
          <div className="text-xs font-bold uppercase tracking-wide text-purple-300">
            {c.emoji} {c.year}
          </div>
          <div className="font-bold">{c.title}</div>
          <p className="text-sm text-white/75">{c.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

const BODIES: Record<SectionId, () => JSX.Element> = {
  welcome: Welcome,
  projects: Projects,
  about: About,
  story: Story,
};

export function SectionOverlay() {
  const active = useGame((s) => s.activeSection);
  const close = useGame((s) => s.openSection);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
          onClick={() => close(null)}
        >
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-3xl border-2 p-6 shadow-2xl"
            style={{
              borderColor: `${SECTIONS[active].color}66`,
              background:
                "linear-gradient(160deg, rgba(20,20,24,0.97), rgba(8,8,10,0.99))",
            }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2
                  className="font-display text-3xl font-bold tracking-tight"
                  style={{ color: SECTIONS[active].color }}
                >
                  {SECTIONS[active].title}
                </h2>
                <p className="text-sm text-white/60">
                  {SECTIONS[active].subtitle}
                </p>
              </div>
              <button
                onClick={() => close(null)}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-bold hover:bg-white/20"
              >
                Esc ✕
              </button>
            </div>
            {BODIES[active]()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
