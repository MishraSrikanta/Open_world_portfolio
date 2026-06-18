"use client";

import { useEffect, useRef } from "react";
import { playerPos, playerForward } from "../playerState";
import { SECTION_LIST, WORLD_HALF } from "../constants";

/**
 * Canvas-drawn top-down minimap. Reads the live player position each frame and
 * draws section markers + the player arrow. Pure canvas = zero React churn.
 */
export function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const size = 150;
    const scale = size / (WORLD_HALF * 2);
    let raf = 0;

    const toMap = (x: number, z: number) => ({
      x: (x + WORLD_HALF) * scale,
      y: (z + WORLD_HALF) * scale,
    });

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      // ground
      ctx.fillStyle = "#5f9a44";
      ctx.fillRect(0, 0, size, size);
      // roads
      ctx.strokeStyle = "#cbb98f";
      ctx.lineWidth = 4;
      const c = toMap(0, 0);
      SECTION_LIST.forEach((s) => {
        const e = toMap(s.position[0], s.position[2]);
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(e.x, e.y);
        ctx.stroke();
      });
      // junction
      ctx.fillStyle = "#cbb98f";
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      // section markers
      SECTION_LIST.forEach((s) => {
        const e = toMap(s.position[0], s.position[2]);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(e.x, e.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      // player arrow
      const p = toMap(playerPos.x, playerPos.z);
      const ang = Math.atan2(playerForward.x, playerForward.z);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(-ang);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(4, 5);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative h-[150px] w-[150px] overflow-hidden rounded-xl border border-white/10 bg-ink-900/70 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <canvas ref={canvasRef} width={150} height={150} />
    </div>
  );
}
