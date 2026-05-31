#!/usr/bin/env node

/**
 * LLM Brand Mention Monitor
 *
 * Queries multiple LLM providers with configurable prompts and tracks
 * whether NW Homeworks (or configured brand) is mentioned in responses.
 *
 * Usage:
 *   node monitor.mjs              # Full run (all providers, all prompts)
 *   node monitor.mjs --quick      # Single sample per prompt (fast check)
 *   node monitor.mjs --provider openai   # Only run one provider
 *   node monitor.mjs --report     # Just regenerate the HTML report from existing data
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8'));

// ---------------------------------------------------------------------------
// Load .env file manually (no dependencies needed)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = join(__dirname, '.env');
  if (!existsSync(envPath)) {
    console.error('No .env file found. Copy .env.example to .env and add your API keys.');
    process.exit(1);
  }
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// ---------------------------------------------------------------------------
// Provider API calls — each returns the LLM's text response
// ---------------------------------------------------------------------------

async function queryOpenAI(prompt) {
  // Use the Responses API with web search enabled — this matches what
  // users experience in the ChatGPT UI, where the model can search the web
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: config.providers.openai.model,
      input: prompt,
      tools: [{ type: 'web_search_preview' }]
    })
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // The Responses API returns output as an array of items
  const textItem = data.output.find(item => item.type === 'message');
  return textItem.content.find(c => c.type === 'output_text').text;
}

async function queryAnthropic(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.providers.anthropic.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content[0].text;
}

async function queryGoogle(prompt) {
  // Use Google Search grounding so Gemini can find real businesses
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.providers.google.model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 1.0 },
      tools: [{ google_search: {} }]
    })
  });
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // With grounding, response may have multiple parts
  const parts = data.candidates[0].content.parts;
  return parts.map(p => p.text).filter(Boolean).join('\n');
}

async function queryPerplexity(prompt) {
  const res = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: config.providers.perplexity.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 1.0
    })
  });
  if (!res.ok) throw new Error(`Perplexity ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function queryGrok(prompt) {
  // Use the Responses API with web_search tool — matches what users see in the Grok UI
  const res = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: config.providers.grok.model,
      input: [{ role: 'user', content: prompt }],
      tools: [{ type: 'web_search' }]
    })
  });
  if (!res.ok) throw new Error(`Grok ${res.status}: ${await res.text()}`);
  const data = await res.json();
  // Find the message output and extract text
  const messageItem = data.output.find(item => item.content);
  const textContent = messageItem.content.find(c => c.type === 'output_text');
  return textContent.text;
}

const providerFunctions = {
  openai: queryOpenAI,
  anthropic: queryAnthropic,
  google: queryGoogle,
  perplexity: queryPerplexity,
  grok: queryGrok
};

// ---------------------------------------------------------------------------
// Brand detection
// ---------------------------------------------------------------------------

function detectBrand(text) {
  const lower = text.toLowerCase();
  const terms = [config.brand.name.toLowerCase(), ...config.brand.aliases.map(a => a.toLowerCase())];
  const found = terms.some(term => lower.includes(term));
  return { mentioned: found };
}

function extractCompetitors(text) {
  // Common Seattle remodeling companies to watch for
  const competitors = [
    'Model Remodel', 'Classique Floors', 'Neil Kelly', 'Hammer & Hand',
    'Best Suited', 'Ventana Construction', 'CRD Design Build',
    'Envision', 'Arciform', 'Board & Vellum', 'Gaspar\'s Construction',
    'True North', 'Dyna Contracting', 'Brio', 'Parquetry',
    'CASO Design', 'Potter Construction', 'Emerald City Construction',
    'Metis Construction', 'Alpine General Contracting', 'Pelleco',
    'RW Anderson', 'Corvus Construction'
  ];

  const found = [];
  const lower = text.toLowerCase();
  for (const comp of competitors) {
    if (lower.includes(comp.toLowerCase())) {
      found.push(comp);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

async function runSingleQuery(provider, queryFn, prompt, sampleNum) {
  const start = Date.now();
  try {
    const response = await queryFn(prompt);
    const elapsed = Date.now() - start;
    const brand = detectBrand(response);
    const competitors = extractCompetitors(response);

    return {
      provider,
      prompt,
      sample: sampleNum,
      timestamp: new Date().toISOString(),
      responseTimeMs: elapsed,
      mentioned: brand.mentioned,
      competitors,
      response,
      error: null
    };
  } catch (err) {
    return {
      provider,
      prompt,
      sample: sampleNum,
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - start,
      mentioned: false,
      competitors: [],
      response: null,
      error: err.message
    };
  }
}

async function runMonitor(options = {}) {
  const { quick = false, providerFilter = null } = options;
  const samples = quick ? 1 : config.samplesPerPrompt;

  const providers = Object.entries(config.providers)
    .filter(([name, cfg]) => cfg.enabled)
    .filter(([name]) => !providerFilter || name === providerFilter);

  if (providers.length === 0) {
    console.error('No providers enabled or matched filter.');
    process.exit(1);
  }

  // Check for required API keys
  const keyMap = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
    grok: 'XAI_API_KEY'
  };

  const activeProviders = providers.filter(([name]) => {
    const key = process.env[keyMap[name]];
    if (!key || key.endsWith('...')) {
      console.warn(`  Skipping ${name} — no API key configured`);
      return false;
    }
    return true;
  });

  if (activeProviders.length === 0) {
    console.error('No providers have valid API keys. Update your .env file.');
    process.exit(1);
  }

  const totalQueries = activeProviders.length * config.prompts.length * samples;
  console.log(`\nLLM Brand Monitor — ${config.brand.name}`);
  console.log(`Providers: ${activeProviders.map(([n]) => n).join(', ')}`);
  console.log(`Prompts: ${config.prompts.length} | Samples: ${samples} | Total queries: ${totalQueries}`);
  console.log('─'.repeat(60));

  const results = [];
  let completed = 0;

  for (const [providerName, providerCfg] of activeProviders) {
    const queryFn = providerFunctions[providerName];
    console.log(`\n▶ ${providerName} (${providerCfg.model})`);

    for (const prompt of config.prompts) {
      for (let s = 1; s <= samples; s++) {
        const result = await runSingleQuery(providerName, queryFn, prompt, s);
        results.push(result);
        completed++;

        const icon = result.error ? '✗' : result.mentioned ? '★' : '·';
        const progress = `[${completed}/${totalQueries}]`;
        const shortPrompt = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt;
        console.log(`  ${icon} ${progress} ${shortPrompt}${result.mentioned ? ' — MENTIONED' : ''}`);

        // Brief pause to respect rate limits
        await new Promise(r => setTimeout(r, 300));
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Save results
// ---------------------------------------------------------------------------

function saveResults(results) {
  const outputDir = join(__dirname, config.outputDir);
  mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `run-${timestamp}.json`;
  const filepath = join(outputDir, filename);

  const summary = buildSummary(results);

  const output = {
    runDate: new Date().toISOString(),
    brand: config.brand.name,
    totalQueries: results.length,
    summary,
    results
  };

  writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to: ${filepath}`);
  return filepath;
}

function buildSummary(results) {
  const byProvider = {};
  const byPrompt = {};

  for (const r of results) {
    if (r.error) continue;

    // By provider
    if (!byProvider[r.provider]) {
      byProvider[r.provider] = { total: 0, mentioned: 0, competitors: {} };
    }
    byProvider[r.provider].total++;
    if (r.mentioned) byProvider[r.provider].mentioned++;
    for (const comp of r.competitors) {
      byProvider[r.provider].competitors[comp] = (byProvider[r.provider].competitors[comp] || 0) + 1;
    }

    // By prompt
    if (!byPrompt[r.prompt]) {
      byPrompt[r.prompt] = { total: 0, mentioned: 0, providers: {} };
    }
    byPrompt[r.prompt].total++;
    if (r.mentioned) byPrompt[r.prompt].mentioned++;
    if (!byPrompt[r.prompt].providers[r.provider]) {
      byPrompt[r.prompt].providers[r.provider] = { total: 0, mentioned: 0 };
    }
    byPrompt[r.prompt].providers[r.provider].total++;
    if (r.mentioned) byPrompt[r.prompt].providers[r.provider].mentioned++;
  }

  // Calculate rates
  for (const p of Object.values(byProvider)) {
    p.mentionRate = p.total ? Math.round((p.mentioned / p.total) * 100) : 0;
  }
  for (const p of Object.values(byPrompt)) {
    p.mentionRate = p.total ? Math.round((p.mentioned / p.total) * 100) : 0;
  }

  return { byProvider, byPrompt };
}

// ---------------------------------------------------------------------------
// HTML Report Generator
// ---------------------------------------------------------------------------

function generateReport() {
  const outputDir = join(__dirname, config.outputDir);
  const files = readdirSync(outputDir)
    .filter(f => f.startsWith('run-') && f.endsWith('.json'))
    .sort();

  if (files.length === 0) {
    console.error('No result files found. Run the monitor first.');
    process.exit(1);
  }

  const allRuns = files.map(f => JSON.parse(readFileSync(join(outputDir, f), 'utf-8')));
  const latest = allRuns[allRuns.length - 1];

  const providerNames = Object.keys(latest.summary.byProvider);
  const prompts = Object.keys(latest.summary.byPrompt);

  // Build trend data (mention rate per provider per run)
  const trendData = allRuns.map(run => {
    const point = { date: run.runDate.slice(0, 10) };
    for (const prov of providerNames) {
      const p = run.summary.byProvider[prov];
      point[prov] = p ? p.mentionRate : null;
    }
    return point;
  });

  // Competitor frequency across latest run
  const competitorCounts = {};
  for (const r of latest.results) {
    for (const comp of r.competitors) {
      competitorCounts[comp] = (competitorCounts[comp] || 0) + 1;
    }
  }
  const sortedCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const providerColors = {
    openai: '#10a37f',
    anthropic: '#d4a574',
    google: '#4285f4',
    perplexity: '#20808d',
    grok: '#1da1f2'
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>LLM Brand Monitor — ${config.brand.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e1e4e8; padding: 2rem; }
  h1 { font-size: 1.8rem; margin-bottom: 0.5rem; color: #fff; }
  .subtitle { color: #8b949e; margin-bottom: 2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 1.25rem; }
  .card h3 { font-size: 0.85rem; color: #8b949e; text-transform: uppercase; margin-bottom: 0.5rem; }
  .card .value { font-size: 2rem; font-weight: 700; }
  .card .detail { font-size: 0.8rem; color: #8b949e; margin-top: 0.25rem; }
  .mention-rate { color: #3fb950; }
  .mention-rate.low { color: #f85149; }
  .mention-rate.mid { color: #d29922; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
  th, td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid #21262d; }
  th { color: #8b949e; font-size: 0.8rem; text-transform: uppercase; background: #161b22; position: sticky; top: 0; }
  td { font-size: 0.9rem; }
  tr:hover { background: #161b22; }
  .pill { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
  .pill.yes { background: #238636; color: #fff; }
  .pill.no { background: #30363d; color: #8b949e; }
  .pill.partial { background: #9e6a03; color: #fff; }
  .section { margin-bottom: 2.5rem; }
  .section h2 { font-size: 1.2rem; margin-bottom: 1rem; color: #fff; border-bottom: 1px solid #30363d; padding-bottom: 0.5rem; }
  .competitor-bar { display: flex; align-items: center; margin-bottom: 0.4rem; }
  .competitor-bar .name { width: 200px; font-size: 0.85rem; }
  .competitor-bar .bar { height: 20px; background: #388bfd; border-radius: 3px; margin-right: 0.5rem; }
  .competitor-bar .count { font-size: 0.8rem; color: #8b949e; }
  .provider-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
  .response-toggle { cursor: pointer; color: #58a6ff; font-size: 0.8rem; }
  .response-text { display: none; margin-top: 0.5rem; padding: 0.75rem; background: #0d1117; border: 1px solid #30363d; border-radius: 4px; font-size: 0.8rem; line-height: 1.5; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }
  .response-text.open { display: block; }
  .run-selector { margin-bottom: 1.5rem; }
  .run-selector select { background: #161b22; color: #e1e4e8; border: 1px solid #30363d; padding: 0.5rem; border-radius: 4px; }
</style>
</head>
<body>

<h1>LLM Brand Monitor</h1>
<p class="subtitle">${config.brand.name} &mdash; Report generated ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

<!-- Provider overview cards -->
<div class="grid">
${providerNames.map(name => {
  const p = latest.summary.byProvider[name];
  const rateClass = p.mentionRate >= 50 ? '' : p.mentionRate >= 20 ? 'mid' : 'low';
  return `  <div class="card">
    <h3><span class="provider-dot" style="background:${providerColors[name] || '#888'}"></span>${name}</h3>
    <div class="value mention-rate ${rateClass}">${p.mentionRate}%</div>
    <div class="detail">${p.mentioned} of ${p.total} responses mention ${config.brand.name}</div>
  </div>`;
}).join('\n')}
  <div class="card">
    <h3>Overall</h3>
    <div class="value mention-rate ${
      Math.round(latest.results.filter(r => r.mentioned).length / latest.results.filter(r => !r.error).length * 100) >= 50 ? '' : 'mid'
    }">${Math.round(latest.results.filter(r => r.mentioned).length / latest.results.filter(r => !r.error).length * 100)}%</div>
    <div class="detail">${latest.results.filter(r => r.mentioned).length} of ${latest.results.filter(r => !r.error).length} total responses</div>
  </div>
</div>

<!-- Prompt breakdown table -->
<div class="section">
  <h2>Mention by Prompt</h2>
  <table>
    <thead>
      <tr>
        <th>Prompt</th>
        ${providerNames.map(n => `<th><span class="provider-dot" style="background:${providerColors[n] || '#888'}"></span>${n}</th>`).join('\n        ')}
        <th>Overall</th>
      </tr>
    </thead>
    <tbody>
${prompts.map(prompt => {
  const p = latest.summary.byPrompt[prompt];
  return `      <tr>
        <td>${prompt}</td>
        ${providerNames.map(name => {
          const prov = p.providers[name];
          if (!prov) return '<td>—</td>';
          const rate = Math.round(prov.mentioned / prov.total * 100);
          const cls = rate === 100 ? 'yes' : rate > 0 ? 'partial' : 'no';
          return `<td><span class="pill ${cls}">${prov.mentioned}/${prov.total}</span></td>`;
        }).join('\n        ')}
        <td><span class="pill ${p.mentionRate >= 50 ? 'yes' : p.mentionRate > 0 ? 'partial' : 'no'}">${p.mentionRate}%</span></td>
      </tr>`;
}).join('\n')}
    </tbody>
  </table>
</div>

<!-- Competitors -->
<div class="section">
  <h2>Competitor Mentions (This Run)</h2>
  ${sortedCompetitors.length === 0 ? '<p style="color:#8b949e">No known competitors detected in responses.</p>' :
  sortedCompetitors.map(([name, count]) => {
    const maxCount = sortedCompetitors[0][1];
    const width = Math.round((count / maxCount) * 300);
    return `  <div class="competitor-bar">
    <span class="name">${name}</span>
    <span class="bar" style="width:${width}px"></span>
    <span class="count">${count} mentions</span>
  </div>`;
  }).join('\n')}
</div>

<!-- Trend over time (if multiple runs) -->
${allRuns.length > 1 ? `
<div class="section">
  <h2>Mention Rate Trend</h2>
  <table>
    <thead>
      <tr>
        <th>Run Date</th>
        ${providerNames.map(n => `<th>${n}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
${trendData.map(point => `      <tr>
        <td>${point.date}</td>
        ${providerNames.map(n => `<td>${point[n] !== null ? point[n] + '%' : '—'}</td>`).join('')}
      </tr>`).join('\n')}
    </tbody>
  </table>
</div>` : ''}

<!-- Full responses (collapsible) -->
<div class="section">
  <h2>Full Responses (Latest Run)</h2>
  <table>
    <thead>
      <tr><th>Provider</th><th>Prompt</th><th>Mentioned</th><th>Response</th></tr>
    </thead>
    <tbody>
${latest.results.filter(r => !r.error).map((r, i) => `      <tr>
        <td><span class="provider-dot" style="background:${providerColors[r.provider] || '#888'}"></span>${r.provider}</td>
        <td style="max-width:300px">${r.prompt}</td>
        <td><span class="pill ${r.mentioned ? 'yes' : 'no'}">${r.mentioned ? 'Yes' : 'No'}</span></td>
        <td>
          <span class="response-toggle" onclick="this.nextElementSibling.classList.toggle('open')">Show/Hide</span>
          <div class="response-text">${(r.response || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </td>
      </tr>`).join('\n')}
    </tbody>
  </table>
</div>

</body>
</html>`;

  const reportPath = join(__dirname, 'report.html');
  writeFileSync(reportPath, html);
  console.log(`\nReport saved to: ${reportPath}`);

  // Also save a copy to the desktop for easy access
  const desktopPath = join(process.env.USERPROFILE || process.env.HOME, 'Desktop', 'LLM-Monitor-Report.html');
  try {
    writeFileSync(desktopPath, html);
    console.log(`Desktop copy saved to: ${desktopPath}`);
  } catch (e) {
    console.warn(`Could not save to desktop: ${e.message}`);
  }

  return reportPath;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--report')) {
    generateReport();
    return;
  }

  loadEnv();

  const quick = args.includes('--quick');
  const providerIdx = args.indexOf('--provider');
  const providerFilter = providerIdx !== -1 ? args[providerIdx + 1] : null;

  const results = await runMonitor({ quick, providerFilter });

  // Print summary
  const summary = buildSummary(results);
  console.log('\n' + '═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));
  for (const [provider, data] of Object.entries(summary.byProvider)) {
    console.log(`  ${provider}: ${data.mentionRate}% mention rate (${data.mentioned}/${data.total})`);
  }

  const totalMentioned = results.filter(r => r.mentioned).length;
  const totalValid = results.filter(r => !r.error).length;
  const overallRate = totalValid ? Math.round((totalMentioned / totalValid) * 100) : 0;
  console.log(`\n  Overall: ${overallRate}% (${totalMentioned}/${totalValid})`);

  // Gaps — prompts with 0% mention rate
  const gaps = Object.entries(summary.byPrompt)
    .filter(([_, data]) => data.mentionRate === 0)
    .map(([prompt]) => prompt);

  if (gaps.length > 0) {
    console.log('\n  Content gaps (never mentioned):');
    for (const g of gaps) {
      console.log(`    • ${g}`);
    }
  }

  saveResults(results);
  generateReport();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
