# poke — Poke Labs CLI

> Interact with Council micro-services from your terminal.

## Install

**Option 1 — npm:**
```bash
npm install -g poke
```

**Option 2 — Python (no npm needed):**
```bash
# Clone and use directly
git clone https://github.com/pokelabshq/cli.git
cd cli
./bin/poke --help

# Or copy to your PATH
cp bin/poke /usr/local/bin/poke
chmod +x /usr/local/bin/poke
```

## Quick Start

```bash
# Start Council services first
git clone https://github.com/pokelabshq/council.git
cd council && docker compose up

# Use the CLI
poke preview https://github.com
poke sentiment "I love this!"
poke qr "https://pokelabs.org"
poke dns example.com
poke colors "#00d4ff"
poke health
poke services
```

## Commands

| Command | Description |
|---------|-------------|
| `poke preview <url>` | Extract link preview metadata |
| `poke keywords <text>` | Extract keywords from text |
| `poke summarize <text>` | Summarize text |
| `poke sentiment <text>` | Analyze sentiment |
| `poke qr <text>` | Generate QR code SVG |
| `poke dns <domain>` | Check DNS records |
| `poke colors <hex>` | Generate color palette |
| `poke shorten <url>` | Shorten a URL |
| `poke health` | Check all service health |
| `poke services` | List all services |

## Environment

- `COUNCIL_URL` — Base URL of the Council gateway (default: `http://localhost:8700`)

## License

MIT · [Poke Labs](https://pokelabs.org)
