"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useGame } from "../store";
import { PROFILE, STORY } from "../content";

/** "About the Author" modal opened from the bronze statue in the world. */
export function AuthorModal() {
  const open = useGame((s) => s.authorOpen);
  const setOpen = useGame((s) => s.setAuthorOpen);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.94, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/95 p-6 shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-1 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-accent">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  About the Author
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-white">
                  {PROFILE.name}
                </h2>
                <p className="text-sm text-white/55">{PROFILE.role}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm font-semibold hover:bg-white/10"
              >
                Esc ✕
              </button>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-white/80">
              {PROFILE.intro}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {PROFILE.achievements.map((a) => (
                <div
                  key={a}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                >
                  {a}
                </div>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                Journey
              </div>
              <div className="space-y-2">
                {[STORY[0], STORY[Math.floor(STORY.length / 2)], STORY[STORY.length - 1]].map(
                  (c) => (
                    <div key={c.year} className="flex items-start gap-2.5 text-sm">
                      <span className="text-base">{c.emoji}</span>
                      <div>
                        <span className="font-display font-semibold text-accent-soft">
                          {c.year}
                        </span>
                        <span className="text-white/70"> — {c.title}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={PROFILE.siteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display font-bold text-ink-950 transition hover:bg-accent-soft"
              >
                Visit my site ↗
              </a>
              <a
                href={PROFILE.resumeUrl}
                download
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 font-display font-semibold text-white transition hover:border-accent hover:text-accent"
              >
                ⬇ Résumé
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
