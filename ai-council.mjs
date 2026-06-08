#!/usr/bin/env node
/**
 * ai-council — Multi-agent deliberation in your terminal
 * Poke Labs (MIT License)
 * 
 * Usage: ai-council <question>
 * Example: ai-council "Should I use Postgres or SQLite?"
 */

import https from "https";
import http from "http";

const GATEWAY_URL = process.env.POKE_GATEWAY || "http://localhost:8700";

const PERSONAS = [
  { name: "🎯 The Strategist", role: "market fit, positioning, moats" },
  { name: "🚀 The Hustler", role: "growth, shipping, scrappy tactics" },
  { name: "🔧 The Engineer", role: "feasibility, architecture, best practices" },
  { name: "💀 The Critic", role: "devil's advocate, finds flaws" },
  { name: "🌿 The Visionary", role: "big picture, future trends" },
];

const C = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", magenta: "\x1b[35m", cyan: "\x1b[36m",
};

function clr(c, t) { return `${C[c] || ""}${t}${C.reset}`; }

function banner() {
  console.log(clr("cyan", " ____   ___  _   _ _____       _        ____"));
  console.log(clr("cyan", "|  _ \\ / _ \\| | | | ____|     | |      | __ )"));
  console.log(clr("cyan", "| |_) | | | | |_| |  _|       | |      |  _ \\"));
  console.log(clr("cyan", "|  __/| |_| |  _| | |_| _____| |____  | |_) |"));
  console.log(clr("cyan", "|_|    \\___/ \\__| |____|_____|______| |____/"));
  console.log();
  console.log(clr("dim", "  AI Council — Multi-agent deliberation"));
  console.log(clr("dim", "  Poke Labs · MIT License · pokelabs.org"));
  console.log();
}

function httpGet(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { timeout: 3000 }, (res) => {
      let d = "";
      res.on("data", (c) => d += c);
      res.on("end", () => resolve({ ok: res.statusCode < 400, data: d }));
    });
    req.on("error", () => resolve({ ok: false, data: "" }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, data: "" }); });
  });
}

async function deliberate(question) {
  console.log(clr("bold", `Question: "${question}"`));
  console.log();

  // Try the link-preview service as a sanity check
  const gw = await httpGet(`${GATEWAY_URL}/link-preview/api/health`);
  
  if (gw.ok) {
    console.log(clr("green", "Gateway online. Local deliberation mode."));
  } else {
    console.log(clr("yellow", "Gateway offline. Using built-in deliberation."));
  }
  console.log();

  const perspectives = {
    "🎯 The Strategist": (q) => `Strategic lens: For "${q}", consider your competitive moat. What's defensible? What's the 10x advantage?`,
    "🚀 The Hustler": (q) => `Growth lens: For "${q}", ship an MVP in a week. Talk to users. Iterate based on signal, not speculation.`,
    "🔧 The Engineer": (q) => `Engineering lens: For "${q}", keep it simple. Choose boring tech. Write tests. Document everything.`,
    "💀 The Critic": (q) => `Critical lens: For "${q}" — what's the worst case? What are you assuming that might be wrong? Stress-test this.`,
    "🌿 The Visionary": (q) => `Vision lens: For "${q}", zoom out 5 years. Where is this going? What platform shift are we riding?`,
  };

  for (const p of PERSONAS) {
    console.log(clr("yellow", `${p.name} (${p.role}):`));
    console.log(`  ${perspectives[p.name](question)}`);
    console.log();
  }

  console.log(clr("dim", "─".repeat(60)));
  console.log(clr("cyan", "Council complete. The decision is yours."));
}

const args = process.argv.slice(2);

if (!args.length || args[0] === "--help" || args[0] === "-h") {
  banner();
  console.log(clr("bold", "Usage:"));
  console.log("  ai-council <question>     Ask the council");
  console.log("  ai-council --status       Check gateway");
  console.log("  ai-council --version      Version info");
  console.log();
  console.log(clr("bold", "Env:"));
  console.log("  POKE_GATEWAY    URL (default: http://localhost:8700)");
  process.exit(0);
}

if (args[0] === "--version" || args[0] === "-v") {
  console.log("ai-council 0.1.0 · Poke Labs · MIT");
  process.exit(0);
}

if (args[0] === "--status") {
  banner();
  const gw = await httpGet(`${GATEWAY_URL}/link-preview/api/health`);
  console.log(`Gateway: ${gw.ok ? clr("green", "ONLINE") : clr("red", "OFFLINE")} (${GATEWAY_URL})`);
  console.log(`Personas: ${PERSONAS.length}`);
  process.exit(0);
}

banner();
await deliberate(args.join(" "));
