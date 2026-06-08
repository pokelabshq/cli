#!/usr/bin/env node
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const cmd = args[0] || 'help';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'poke-cli/1.0' } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    }).on('error', reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: u.hostname, port: u.port || 80, path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

const API = 'http://localhost:8766';

async function status() {
  console.log('🔍 Poke Labs Status\n');
  const checks = [
    { name: 'Link Preview API', url: `${API}/api/health`, port: 8766 },
    { name: 'Poke Bot', url: 'http://localhost:8770/', port: 8770 },
  ];
  for (const c of checks) {
    try {
      await fetchJSON(c.url);
      console.log(`  ✅ ${c.name} — :${c.port}`);
    } catch(e) {
      console.log(`  ❌ ${c.name} — :${c.port} (DOWN)`);
    }
  }
  console.log('\n  Run: poke deploy  (to restart services)');
}

async function preview() {
  const url = args[1];
  if (!url) { console.log('Usage: poke preview <url>'); process.exit(1); }
  try {
    const d = await httpPost(`${API}/api/preview`, { url });
    console.log(`\n  📄 ${d.title || '(no title)'}`);
    console.log(`  📝 ${(d.description || '(no desc)').slice(0, 120)}`);
    if (d.image) console.log(`  🖼️  ${d.image}`);
    console.log(`  🌐 ${d.site_name || new URL(url).hostname}`);
    if (d.free_remaining !== undefined) console.log(`  💳 ${d.free_remaining} free left`);
    if (d.wallet) console.log(`  💰 Send USDC to ${d.wallet} (Base)`);
  } catch(e) {
    console.log('  ❌ API unavailable. Run: poke deploy');
  }
}

async function repos() {
  try {
    const data = await fetchJSON('https://api.github.com/users/pokelabshq/repos?per_page=30&sort=updated');
    console.log('📦 Poke Labs Repos\n');
    data.filter(r => !r.fork).forEach(r => {
      console.log(`  ${r.name.padEnd(15)} ${r.language || '?'}  ⭐${r.stargazers_count || 0}  ${r.updated_at?.slice(0,10)}`);
    });
  } catch(e) { console.log('  ❌ GitHub API error'); }
}

async function depscheck() {
  console.log('📦 Dependency Check\n');
  const repos = ['council', 'poke'];
  for (const repo of repos) {
    try {
      const raw = execSync(
        `cd /home/alx/repo-work/${repo} && npm outdated --json 2>/dev/null || echo "{}"`,
        { encoding: 'utf8', timeout: 15000 }
      );
      const data = JSON.parse(raw);
      const keys = Object.keys(data);
      if (!keys.length) {
        console.log(`  ✅ ${repo} — up to date`);
      } else {
        console.log(`  ⚠️  ${repo} — ${keys.length} outdated:`);
        keys.forEach(k => {
          const d = data[k];
          console.log(`     ${k}: ${d.current} → ${d.latest}`);
        });
      }
    } catch(e) { console.log(`  ❌ ${repo} — check failed`); }
  }
}

function deploy() {
  console.log('🚀 Deploying...\n');
  try {
    execSync('bash /home/alx/start.sh', { stdio: 'inherit' });
  } catch(e) { console.log('  ❌ deploy failed'); }
}

function help() {
  console.log(`
  @pokelabshq/poke-cli v1.0.0

  Commands:
    status              Check all service health
    preview <url>       Preview a URL (title, desc, image)
    repos               List all pokelabshq repos
    deps                Check for outdated dependencies
    deploy              Restart all services
    help                Show this help

  Examples:
    poke status
    poke preview https://github.com
    poke deps
    poke deploy
  `);
}

(async () => {
  try {
    switch (cmd) {
      case 'status':   await status(); break;
      case 'preview':  await preview(); break;
      case 'repos':    await repos(); break;
      case 'deps':     await depscheck(); break;
      case 'deploy':   deploy(); break;
      case 'help':
      default:         help(); break;
    }
  } catch(e) { console.error('Error:', e.message); process.exit(1); }
})();
