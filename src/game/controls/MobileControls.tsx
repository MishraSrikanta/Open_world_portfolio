"use client";

import { useEffect, useRef, useState } from "react";
import { input } from "./input";
import { useGame } from "../store";

const RADIUS = 56;

/**
 * Generic on-screen thumb-stick. Reports the normalized stick vector (each
 * axis -1..1) through `onChange` while dragged, and (0, 0) on release. Purely
 * visual state lives in React; the actual control values are written to the
 * input singleton by the callback so movement never triggers re-renders.
 */
function Stick({
  accent,
  onChange,
}: {
  accent?: string;
  onChange: (nx: number, ny: number) => void;
}) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(false);
  const center = useRef({ x: 0, y: 0 });

  const start = (clientX: number, clientY: number) => {
    const el = baseRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    center.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    active.current = true;
    move(clientX, clientY);
  };
  const move = (clientX: number, clientY: number) => {
    if (!active.current) return;
    let dx = clientX - center.current.x;
    let dy = clientY - center.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > RADIUS) {
      dx = (dx / dist) * RADIUS;
      dy = (dy / dist) * RADIUS;
    }
    setKnob({ x: dx, y: dy });
    onChange(dx / RADIUS, dy / RADIUS);
  };
  const end = () => {
    active.current = false;
    setKnob({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      ref={baseRef}
      onTouchStart={(e) => start(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => move(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={end}
      onTouchCancel={end}
      className="pointer-events-auto relative h-32 w-32 rounded-full border border-white/20 bg-white/[0.05] shadow-[inset_0_0_30px_rgba(255,255,255,0.04)] backdrop-blur-md"
    >
      {/* faint guide ring */}
      <div className="pointer-events-none absolute inset-3 rounded-full border border-white/10" />
      <div
        className="absolute left-1/2 top-1/2 h-14 w-14 rounded-full border border-white/40 bg-white/25 shadow-[0_0_18px_rgba(103,232,249,0.35)] backdrop-blur-md"
        style={{
          transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))`,
          borderColor: accent ? `${accent}aa` : undefined,
        }}
      />
    </div>
  );
}

/** Left thumb-stick → movement. Writes directly into input.move. */
function MoveStick() {
  return (
    <Stick
      onChange={(nx, ny) => {
        input.moveX = nx;
        input.moveY = -ny;
      }}
    />
  );
}

/**
 * Right thumb-stick → camera look. Look is an incremental delta consumed and
 * reset each frame, so while the stick is held we feed it a velocity (knob
 * offset × sensitivity) on every animation frame.
 */
function LookStick() {
  const vec = useRef({ x: 0, y: 0 });
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (vec.current.x !== 0 || vec.current.y !== 0) {
        input.lookX += vec.current.x * 7;
        input.lookY += vec.current.y * 5;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <Stick
      accent="#67e8f9"
      onChange={(nx, ny) => {
        vec.current.x = nx;
        vec.current.y = ny;
      }}
    />
  );
}

function PadButton({
  label,
  icon,
  onDown,
  onUp,
  accent,
}: {
  label: string;
  icon: string;
  onDown: () => void;
  onUp?: () => void;
  accent?: string;
}) {
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault();
        onDown();
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        onUp?.();
      }}
      className="pointer-events-auto flex h-14 w-14 select-none flex-col items-center justify-center rounded-full border border-white/20 bg-white/[0.05] text-white shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-blur-md transition active:scale-90 active:bg-white/15"
      style={accent ? { borderColor: `${accent}99`, color: accent } : undefined}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wide opacity-70">
        {label}
      </span>
    </button>
  );
}

export function MobileControls() {
  const isTouch = useGame((s) => s.isTouch);
  const mode = useGame((s) => s.controlMode);
  const started = useGame((s) => s.started);
  const paused = useGame((s) => s.paused);

  if (!isTouch || !started || paused) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 select-none" data-ui>
      {/* left: movement joystick */}
      <div className="absolute bottom-6 left-6 flex flex-col items-center gap-1.5">
        <MoveStick />
        <span className="text-[9px] font-medium uppercase tracking-wide text-white/35">
          Move
        </span>
      </div>

      {/* right: action buttons stacked above the look joystick */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          <PadButton
            label="Sprint"
            icon="»"
            onDown={() => (input.sprint = true)}
            onUp={() => (input.sprint = false)}
          />
          {mode === "player" ? (
            <PadButton
              label="Jump"
              icon="▲"
              accent="#34d399"
              onDown={() => (input.jump = true)}
            />
          ) : (
            <PadButton
              label="Brake"
              icon="■"
              accent="#f87171"
              onDown={() => (input.brake = true)}
              onUp={() => (input.brake = false)}
            />
          )}
          <PadButton
            label="Interact"
            icon="✦"
            accent="#fbbf24"
            onDown={() => (input.interact = true)}
          />
          <PadButton
            label={mode === "player" ? "Ride" : "Exit"}
            icon={mode === "player" ? "🚗" : "🚪"}
            accent="#38bdf8"
            onDown={() => (input.enterVehicle = true)}
          />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <LookStick />
          <span className="text-[9px] font-medium uppercase tracking-wide text-white/35">
            Look
          </span>
        </div>
      </div>
    </div>
  );
}
