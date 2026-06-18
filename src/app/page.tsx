"use client";

import dynamic from "next/dynamic";
import { LoadingOverlay } from "@/game/ui/LoadingOverlay";

// The whole 3D experience is client-only and lazily loaded so the
// initial HTML stays tiny and Three.js never runs on the server.
const Game = dynamic(() => import("@/game/Game").then((m) => m.Game), {
  ssr: false,
  loading: () => <LoadingOverlay progress={0} label="Booting world…" />,
});

export default function Home() {
  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden">
      <Game />
    </main>
  );
}
