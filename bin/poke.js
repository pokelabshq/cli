#!/usr/bin/env node
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));

const COUNCIL_URL = process.env.COUNCIL_URL || "http://localhost:8700";

const args = process.argv.slice(2);
const cmd = args[0];

async function api(service, path, body) {
  const res = await fetch(`${COUNCIL_URL}${path}`, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  if (!cmd || cmd === "--help" || cmd === "-h") {
    console.log(`
poke — Poke Labs CLI v${pkg.version}

Usage:
  poke <command> [options]

Commands:
  preview <url>          Extract link preview metadata
  keywords <text>        Extract keywords from text
  summarize <text>       Summarize text
  sentiment <text>       Analyze sentiment of text
  qr <text>              Generate QR code (SVG)
  dns <domain>           Check DNS records
  colors <hex>           Generate color palette
  shorten <url>          Shorten a URL
  health                 Check all service health
  services               List all available services

Environment:
  COUNCIL_URL  Base URL of council gateway (default: http://localhost:8700)

Examples:
  $ poke preview https://github.com
  $ poke sentiment "I love this product!"
  $ poke qr "https://pokelabs.org"
  $ poke dns example.com
`);
    process.exit(0);
  }

  if (cmd === "--version" || cmd === "-v") {
    console.log(`poke v${pkg.version}`);
    process.exit(0);
  }

  try {
    switch (cmd) {
      case "preview": {
        const url = args.slice(1).join(" ");
        if (!url) { console.error("Usage: poke preview <url>"); process.exit(1); }
        const r = await api("link-preview", "/link-preview/api/preview", { url });
        console.log(`\n  🔗 ${r.title || "No title"}`);
        if (r.description) console.log(`  ${r.description.slice(0, 120)}`);
        if (r.image) console.log(`  🖼️  ${r.image}`);
        console.log(`  ${r.site_name || new URL(url).host}\n`);
        break;
      }
      case "keywords": {
        const text = args.slice(1).join(" ");
        if (!text) { console.error("Usage: poke keywords <text>"); process.exit(1); }
        const r = await api("keyword", "/keyword/api/keywords", { text });
        console.log(`\n  🔑 Keywords: ${(r.keywords || []).join(", ")}\n`);
        break;
      }
      case "summarize": {
        const text = args.slice(1).join(" ");
        if (!text) { console.error("Usage: poke summarize <text>"); process.exit(1); }
        const r = await api("summarize", "/summarize/api/summarize", { text });
        console.log(`\n  📝 ${r.summary || "No summary"}\n`);
        break;
      }
      case "sentiment": {
        const text = args.slice(1).join(" ");
        if (!text) { console.error("Usage: poke sentiment <text>"); process.exit(1); }
        const r = await api("sentiment", "/sentiment/api/analyze", { text });
        const s = r.sentiment || {};
        const emoji = s.label === "positive" ? "😊" : s.label === "negative" ? "😞" : "😐";
        console.log(`\n  ${emoji} ${s.label} (score: ${s.score})`);
        if (r.emotions?.length) console.log(`  Emotions: ${r.emotions.join(", ")}`);
        console.log();
        break;
      }
      case "qr": {
        const text = args.slice(1).join(" ");
        if (!text) { console.error("Usage: poke qr <text>"); process.exit(1); }
        const r = await api("qr", "/qr/api/generate", { text });
        const svg = r.svg || r.qr || "";
        if (svg.startsWith("<svg")) {
          // Save to file
          const { writeFileSync } = await import("fs");
          writeFileSync("qr-code.svg", svg);
          console.log("\n  📱 QR code saved to qr-code.svg\n");
        } else {
          console.log(`\n  📱 ${JSON.stringify(r)}\n`);
        }
        break;
      }
      case "dns": {
        const domain = args[1];
        if (!domain) { console.error("Usage: poke dns <domain>"); process.exit(1); }
        const r = await api("dns", `/dns/api/check?domain=${encodeURIComponent(domain)}`);
        console.log(`\n  🌐 DNS for ${domain}:`);
        for (const [type, records] of Object.entries(r.records || r || {})) {
          if (Array.isArray(records)) {
            records.forEach(rec => console.log(`  ${type}: ${rec}`));
          } else {
            console.log(`  ${type}: ${records}`);
          }
        }
        console.log();
        break;
      }
      case "colors": {
        const hex = args[1];
        if (!hex) { console.error("Usage: poke colors <hex>"); process.exit(1); }
        const r = await api("color", "/color/api/palette", { color: hex });
        const palette = r.palette || r.colors || [];
        console.log(`\n  🎨 Palette for ${hex}:`);
        palette.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
        console.log();
        break;
      }
      case "shorten": {
        const url = args[1];
        if (!url) { console.error("Usage: poke shorten <url>"); process.exit(1); }
        const r = await api("url", "/url/api/shorten", { url });
        console.log(`\n  🔗 Short URL: ${r.short_url || r.short || "N/A"}\n`);
        break;
      }
      case "health": {
        const r = await api("health-agg", "/health-agg/api/health");
        console.log("\n  💓 Service Health:");
        for (const [svc, status] of Object.entries(r.services || r || {})) {
          const ok = status === true || (typeof status === "object" && status.ok);
          console.log(`  ${ok ? "✅" : "❌"} ${svc}`);
        }
        console.log();
        break;
      }
      case "services": {
        console.log(`
  Available Council Services:
  ─────────────────────────────
  🔗 link-preview   URL metadata extraction
  🔑 keyword        Keyword extraction
  📝 summarize      Text summarization
  📱 qr             QR code generation
  🌐 dns            DNS record lookup
  🎨 color          Color palette generation
  🔗 url            URL shortener
  📄 template-gen   Project template generator
  💓 health-agg     Health aggregation
  📦 json2ts        JSON to TypeScript
  🔔 github-webhook GitHub webhook handler
  🧠 sentiment      Sentiment analysis
  🚪 portal         Service portal
  ─────────────────────────────
  Gateway: ${COUNCIL_URL}
`);
        break;
      }
      default:
        console.error(`Unknown command: ${cmd}. Run 'poke --help' for usage.`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n  ❌ Error: ${err.message}`);
    console.error(`  Make sure the Council gateway is running at ${COUNCIL_URL}\n`);
    process.exit(1);
  }
}

main();
