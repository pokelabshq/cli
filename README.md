# Poke CLI v1.0

Zero-dependency command-line toolkit for Poke Labs microservices.

## Install
```
pip install -e .
# or just: python3 poke.py <command>
```

## Commands
- `poke hash <text>` -- SHA256 + MD5
- `poke uuid` -- Generate UUID v4
- `poke color <hex>` -- Hex to RGB/HSL
- `poke json2ts <json>` -- JSON to TypeScript interface
- `poke timestamp [unix]` -- Unix to human-readable
- `poke keywords <text>` -- Extract keywords
- `poke preview <url>` -- Fetch link preview
- `poke status` -- Service statuses
- `poke version` -- Version info

## License
MIT
