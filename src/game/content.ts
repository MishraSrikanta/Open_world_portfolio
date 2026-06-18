/**
 * All portfolio CONTENT lives here so the 3D world stays generic. Edit this
 * file to make the world yours — names, projects, story beats, skills.
 */

export interface Project {
  id: string;
  name: string;
  shop: string; // the in-world shop name
  tagline: string;
  stack: string[];
  features: string[];
  github?: string;
  demo?: string;
  emoji: string;
}

export interface StoryChapter {
  year: string;
  title: string;
  body: string;
  emoji: string;
}

export interface Room {
  name: string;
  emoji: string;
  body: string;
  items: string[];
}

export const PROFILE = {
  name: "Srikanta Mishra",
  role: "Full-Stack & Creative Technologist",
  intro:
    "I build immersive, performant web experiences — from real-time 3D worlds to production-grade applications. Walk around to explore my work.",
  /** Classic portfolio / landing page, linked from the world. */
  siteUrl: "https://srikantalandingpage.vercel.app/",
  resumeUrl: "/resume.pdf",
  achievements: [
    "🏆 Shipped 20+ production apps",
    "⭐ Open-source contributor",
    "🎮 Real-time 3D & WebGL specialist",
    "🚀 Led teams to launch on time",
  ],
};

export const PROJECTS: Project[] = [
  {
    id: "ai-shop",
    name: "Atlas AI Assistant",
    shop: "AI Shop",
    tagline: "Conversational assistant with tool-use and RAG.",
    stack: ["Next.js", "TypeScript", "Claude API", "Postgres", "pgvector"],
    features: ["Streaming responses", "Tool calling", "Vector memory", "Multi-agent"],
    github: "https://github.com/",
    demo: "https://example.com",
    emoji: "🤖",
  },
  {
    id: "game-studio",
    name: "Pixel Realms",
    shop: "Game Studio",
    tagline: "A browser multiplayer game with authoritative netcode.",
    stack: ["Three.js", "WebSockets", "Rapier", "Node"],
    features: ["60 FPS rendering", "Rollback netcode", "Procedural worlds"],
    github: "https://github.com/",
    emoji: "🎮",
  },
  {
    id: "creative-lab",
    name: "Shader Garden",
    shop: "Creative Lab",
    tagline: "Generative GLSL art experiments and tooling.",
    stack: ["GLSL", "React Three Fiber", "WebGL2"],
    features: ["Live shader editor", "Export to video", "Audio-reactive"],
    demo: "https://example.com",
    emoji: "🎨",
  },
  {
    id: "web-agency",
    name: "Beacon Commerce",
    shop: "Web Agency",
    tagline: "High-converting storefronts with sub-second loads.",
    stack: ["Next.js", "Stripe", "Tailwind", "Edge functions"],
    features: ["99 Lighthouse", "A/B testing", "Headless CMS"],
    emoji: "🌐",
  },
  {
    id: "mobile-apps",
    name: "Trail Companion",
    shop: "Mobile Apps",
    tagline: "Offline-first hiking app with live GPS overlays.",
    stack: ["React Native", "Expo", "SQLite", "Mapbox"],
    features: ["Offline maps", "Background tracking", "Social trails"],
    emoji: "📱",
  },
  {
    id: "robotics",
    name: "RoverOS",
    shop: "Robotics Garage",
    tagline: "Telemetry + control dashboard for autonomous rovers.",
    stack: ["ROS", "WebRTC", "Three.js", "Rust"],
    features: ["Live video", "Digital twin", "Path planning"],
    emoji: "🤖",
  },
];

export const ROOMS: Room[] = [
  {
    name: "Office",
    emoji: "💻",
    body: "Where the code happens. Years of shipping across web, mobile, and 3D.",
    items: ["TypeScript", "React / Next.js", "Three.js / WebGL", "Node / Postgres"],
  },
  {
    name: "Library",
    emoji: "📚",
    body: "Skills collected over time — each book a discipline I've gone deep on.",
    items: ["System Design", "Graphics & Shaders", "Performance Eng.", "UX & Motion"],
  },
  {
    name: "Gaming Room",
    emoji: "🎮",
    body: "Play fuels creativity. Game design taught me feel, feedback, and polish.",
    items: ["Game feel", "Procedural gen", "Physics", "Real-time netcode"],
  },
  {
    name: "Workspace",
    emoji: "🛠️",
    body: "Current focus: real-time 3D portfolios and AI-assisted tooling.",
    items: ["R3F", "Rapier", "GLSL", "Claude API"],
  },
];

export const STORY: StoryChapter[] = [
  { year: "School", title: "First lines of code", body: "Discovered programming and never looked back. Built tiny games for fun.", emoji: "🏫" },
  { year: "College", title: "Foundations", body: "Computer science, algorithms, and my first real open-source contributions.", emoji: "🎓" },
  { year: "First Job", title: "Shipping for real", body: "Joined a startup, learned to ship under pressure and own outcomes.", emoji: "💼" },
  { year: "Challenges", title: "Hard problems", body: "Scaled systems, debugged the impossible, and grew through failure.", emoji: "⛰️" },
  { year: "Growth", title: "Going deep", body: "Specialized in real-time graphics and performance engineering.", emoji: "🌱" },
  { year: "Leadership", title: "Lifting others", body: "Mentored engineers and led teams to ship ambitious products.", emoji: "🤝" },
  { year: "Current Role", title: "Today", body: "Building immersive, delightful web experiences end to end.", emoji: "🚀" },
  { year: "Future", title: "What's next", body: "Pushing the boundary of what a portfolio — and the web — can be.", emoji: "✨" },
];
