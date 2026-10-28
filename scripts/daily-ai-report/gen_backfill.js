#!/usr/bin/env node
// One-off generator for the 2026-09-08 daily report + backfill of the Aug 19 - Sep 7 gap.
// Backfilled files are reconstructed from CURRENT source snapshots (release notes, blog
// listings, X timelines) captured on 2026-09-08 — NOT from live 24h windows on each date.
// They are marked clearly as backfilled in the header. Output goes to reports/.

const fs = require('fs');
const path = require('path');

const REPO = 'ai-efficiency';
const BRANCH = 'main';
const COMMIT = 'da141f2';
const GEN_TS = '2026-09-08 (backfill run)';
const OUT = path.join(__dirname, '..', '..', 'reports');

// ---- shared styling ----------------------------------------------------
const STYLE = `
:root{--bg:#fff;--fg:#1a1a1a;--muted:#666;--card:#fafafa;--border:#e3e3e3;
--t1:#2563eb;--t1bg:#eff6ff;--t2:#7c3aed;--t2bg:#f5f3ff;--t4:#16a34a;--t4bg:#f0fdf4;
--warn:#b45309;--warnbg:#fffbeb;--link:#2563eb;}
@media (prefers-color-scheme:dark){:root{--bg:#0f1115;--fg:#e6e6e6;--muted:#9aa0aa;
--card:#161922;--border:#262b36;--t1:#60a5fa;--t1bg:#12233f;--t2:#a78bfa;--t2bg:#241b3d;
--t4:#4ade80;--t4bg:#0f2b1c;--warn:#fbbf24;--warnbg:#2a2410;--link:#7cb0ff;}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);
font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;}
.wrap{max-width:820px;margin:0 auto;padding:32px 20px 64px;}
header h1{font-size:1.6rem;margin:0 0 4px;}
.sub{color:var(--muted);font-size:.9rem;}
.backfill{background:var(--warnbg);border:1px solid var(--warn);color:var(--warn);
border-radius:8px;padding:10px 14px;margin:16px 0;font-size:.9rem;}
h2{font-size:1.15rem;margin:32px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--border);}
.src-group{margin:0 0 18px;}
.src-name{font-size:.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;
letter-spacing:.04em;margin:14px 0 8px;}
.item{border:1px solid var(--border);background:var(--card);border-radius:10px;
padding:14px 16px;margin:0 0 10px;}
.item .top{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px;}
.item a.title{font-weight:600;color:var(--link);text-decoration:none;font-size:1.02rem;}
.item a.title:hover{text-decoration:underline;}
.badge{font-size:.68rem;font-weight:700;padding:2px 7px;border-radius:20px;
text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;}
.b1{background:var(--t1bg);color:var(--t1);} .b2{background:var(--t2bg);color:var(--t2);}
.b4{background:var(--t4bg);color:var(--t4);}
.score{font-size:.72rem;font-weight:700;color:var(--muted);border:1px solid var(--border);
border-radius:20px;padding:2px 8px;}
.summary{font-size:.92rem;color:var(--fg);margin:2px 0 0;}
.hl .item{border-left:3px solid var(--t1);}
.quiet{text-align:center;padding:48px 20px;color:var(--muted);}
.quiet .big{font-size:1.3rem;color:var(--fg);margin-bottom:8px;}
footer{margin-top:40px;padding-top:16px;border-top:1px solid var(--border);
color:var(--muted);font-size:.8rem;line-height:1.5;}
footer code{background:var(--card);padding:1px 5px;border-radius:4px;}
`;

function badge(tier){
  if(tier===1) return '<span class="badge b1">Tier 1 · Vendor</span>';
  if(tier===2) return '<span class="badge b2">Tier 2 · Research</span>';
  return '<span class="badge b4">Tier 4 · Dev Tools</span>';
}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function itemHTML(it){
  return `<div class="item"><div class="top">`+
    `<a class="title" href="${esc(it.url)}">${esc(it.title)}</a>`+
    `${badge(it.tier)}<span class="score">Score ${it.score}</span>`+
    `<span class="badge" style="background:transparent;color:var(--muted)">${esc(it.source)}</span>`+
    `</div><p class="summary">${esc(it.summary)}</p></div>`;
}

// group items by source, sort within group by score desc
function sectionHTML(title,id,items,cls){
  if(!items.length) return '';
  const bySrc={};
  items.forEach(i=>{(bySrc[i.source]=bySrc[i.source]||[]).push(i);});
  let body='';
  Object.keys(bySrc).forEach(src=>{
    const arr=bySrc[src].sort((a,b)=>b.score-a.score);
    body+=`<div class="src-group"><div class="src-name">${esc(src)}</div>`+
      arr.map(itemHTML).join('')+`</div>`;
  });
  return `<section id="${id}" class="${cls||''}"><h2>${esc(title)}</h2>${body}</section>`;
}

function highlightsHTML(items){
  const top=items.filter(i=>i.score>=4).sort((a,b)=>b.score-a.score).slice(0,5);
  if(!top.length) return '';
  return `<section id="highlights" class="hl"><h2>Top Highlights</h2>`+
    top.map(itemHTML).join('')+`</section>`;
}

function page({date,items,scanned,quiet,backfillNote}){
  const vendor=items.filter(i=>i.tier===1);
  const research=items.filter(i=>i.tier===2);
  const devtools=items.filter(i=>i.tier===4);
  const topScore=items.length?Math.max(...items.map(i=>i.score)):0;
  const backfillBanner = backfillNote
    ? `<div class="backfill"><strong>⚠ Backfilled report.</strong> ${esc(backfillNote)}</div>` : '';
  let main;
  if(quiet || !items.length){
    main=`<div class="quiet"><div class="big">Quiet day — no notable AI news in this window.</div>`+
      `<div>${esc(quiet||'Nothing cleared the ranking threshold.')}</div></div>`;
  }else{
    main = highlightsHTML(items)
      + sectionHTML('Vendor Announcements','vendor',vendor)
      + sectionHTML('Research & Community','research',research)
      + sectionHTML('Dev Tools','devtools',devtools);
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">`+
    `<meta name="viewport" content="width=device-width,initial-scale=1">`+
    `<title>Daily AI Report — ${date}${backfillNote?' (backfilled)':''}</title>`+
    `<style>${STYLE}</style></head><body><div class="wrap">`+
    `<header><h1>Daily AI Report — ${date}${backfillNote?' <span style="font-size:.7em;color:var(--warn)">(backfilled)</span>':''}</h1>`+
    `<div class="sub">Generated ${backfillNote?GEN_TS:'2026-09-08'} • ${items.length} item${items.length===1?'':'s'} • top score ${topScore}</div></header>`+
    backfillBanner+
    main+
    `<footer>Sources scanned: ${esc(scanned)}.<br>`+
    `Generated from <code>${REPO}</code> @ <code>${BRANCH}</code> (${COMMIT}) via daily-ai-report pipeline.</footer>`+
    `</div></body></html>`;
}

// ---- data --------------------------------------------------------------
const SCANNED='Anthropic News, Claude Blog, Claude Release Notes, OpenAI News/Research, Google DeepMind, Google AI Blog, AWS, X (@AnthropicAI, @OpenAI, @sama), Simon Willison';
const BF_NOTE_BASE='Reconstructed on 2026-09-08 from current source snapshots (release notes, blog listings, X timelines), not from a live 24h capture on this date. Dates reflect each source\'s stated publication date; engagement/ranking is approximate.';

// reports keyed by date. Empty items => quiet page.
const reports = {
  '2026-08-19': {quiet:'No reconstructable AI announcements dated this day in current source snapshots.', items:[]},
  '2026-08-20': {items:[
    {title:"Anthropic's approach to teaching and learning AI",url:'https://claude.com/blog/anthropics-approach-to-teaching-and-learning-ai',source:'Claude Blog',tier:1,score:3,summary:"Anthropic laid out its framework for how Claude should support teaching and learning. It signals product direction for education use cases that engineers building EdTech agents on Claude should track."},
    {title:'How monday.com transformed its platform into an agent-first product',url:'https://claude.com/blog/how-monday-com-transformed-its-platform-into-an-agent-first-product-where-humans-and-agents-collaborate',source:'Claude Blog',tier:1,score:3,summary:"A case study on monday.com rebuilding its platform so humans and agents collaborate as first-class actors. Useful reference architecture for teams designing agent-native SaaS products."},
    {title:'The Claude Code guide for startups',url:'https://claude.com/blog/claude-code-guide-for-startups',source:'Claude Blog',tier:4,score:3,summary:"Anthropic published a startup-focused guide to adopting Claude Code. Practical onboarding material for small teams standardizing on Claude Code as their coding agent."},
  ]},
  '2026-08-21': {items:[
    {title:'Bringing the cybersecurity capabilities of Claude Mythos 5 to more defenders',url:'https://claude.com/blog/bringing-claude-mythos-5-to-more-defenders',source:'Claude Blog',tier:1,score:4,summary:"Anthropic expanded access to Claude Mythos 5's cybersecurity capabilities for defensive security teams. It matters because frontier-model security tooling is moving from research into deployable defender workflows."},
    {title:'The AI-Native SDLC playbook',url:'https://claude.com/blog/the-ai-native-sdlc-playbook',source:'Claude Blog',tier:1,score:3,summary:"Anthropic published a stage-by-stage playbook for transforming the software development lifecycle with AI. A useful strategic reference for teams operationalizing agentic coding across their SDLC."},
  ]},
  '2026-08-22': {quiet:'No reconstructable AI announcements dated this day in current source snapshots.', items:[]},
  '2026-08-23': {quiet:'No reconstructable AI announcements dated this day in current source snapshots.', items:[]},
  '2026-08-24': {items:[
    {title:'How an Anthropic field marketer uses Claude Code to send weekly personalized updates to every sales rep',url:'https://claude.com/blog/how-an-anthropic-field-marketer-uses-claude-code-to-send-weekly-personalized-updates-to-every-sales-rep',source:'Claude Blog',tier:4,score:3,summary:"An internal workflow story on using Claude Code to automate personalized weekly sales-rep updates. A concrete template for non-engineering teams using coding agents for recurring data-to-comms pipelines."},
  ]},
  '2026-08-25': {items:[
    {title:"Claude's memory works everywhere, and you decide what's in it",url:'https://claude.com/blog/claudes-memory-works-everywhere-and-you-decide-whats-in-it',source:'Claude Release Notes',tier:1,score:4,summary:"Claude's memory now spans chat and Cowork in the cloud, with a Topics UI to edit or delete anything Claude remembers and a setting to exclude sensitive topics. It matters for anyone building on Claude where cross-session context persistence and user data control affect product design."},
    {title:'Bain & Company joins the Claude Partner Network as a Global Premier partner',url:'https://claude.com/blog/bain-company-joins-the-claude-partner-network-as-a-global-premier-partner',source:'Claude Blog',tier:1,score:3,summary:"Bain joined Anthropic's partner network at the top tier. A signal of enterprise-consulting momentum behind Claude adoption rather than a technical change."},
  ]},
  '2026-08-26': {items:[
    {title:'Claude in Chrome is generally available',url:'https://claude.com/blog/claude-in-chrome-generally-available',source:'Claude Blog',tier:1,score:4,summary:"Anthropic moved Claude in Chrome from beta to general availability, letting Claude read, click, and navigate sites alongside the user. Browser-native agent access is now a stable capability engineers can build on."},
    {title:'Claude gets its own browser in Cowork',url:'https://claude.com/blog/cowork-built-in-browser',source:'Claude Blog',tier:1,score:4,summary:"Cowork now ships a built-in browser so Claude can perform web tasks inside its own agentic environment. It expands what Cowork agents can autonomously accomplish without external browser wiring."},
    {title:'How Warp builds self-improving agents on Claude',url:'https://claude.com/blog/how-warp-builds-self-improving-agents-on-claude',source:'Claude Blog',tier:1,score:3,summary:"A case study on how Warp engineers self-improving agents on Claude. Useful design patterns for teams building agents that iterate on their own performance."},
  ]},
  '2026-08-27': {items:[
    {title:'Previewing the Model Hardware Standard (MHS) research preview',url:'https://www.anthropic.com/news/model-hardware-standard-research-preview',source:'Anthropic News / X @AnthropicAI',tier:1,score:4,summary:"Anthropic opened a research preview of the Model Hardware Standard, a shared spec for AI agents to safely operate physical equipment, to select research labs and manufacturers. It's an early move toward standardized, safety-gated agent control of real-world hardware."},
  ]},
  '2026-08-28': {items:[
    {title:'New Fellows research: Can Claude autonomously align other AIs?',url:'https://x.com/AnthropicAI/status/2093386528668172373',source:'X @AnthropicAI',tier:1,score:4,summary:"Anthropic Fellows gave Claude 48 hours and one GPU to improve the alignment of small models; it proposed methods and trained/tested them autonomously with surprisingly good results. An early data point on automated alignment researchers, relevant to anyone tracking self-improving safety pipelines."},
    {title:'Claude for Teachers, now available for U.S. K-12 schools and districts',url:'https://claude.com/blog/claude-for-teachers-now-available-for-schools-and-districts',source:'Claude Blog',tier:1,score:3,summary:"Anthropic launched Claude for Teachers for U.S. K-12 schools and districts. A go-to-market expansion into education rather than a platform capability change."},
    {title:'How Anthropic employees use Claude Tag',url:'https://claude.com/blog/how-anthropic-employees-use-claude-tag',source:'Claude Blog',tier:1,score:3,summary:"An internal look at how Anthropic staff delegate work to Claude via Claude Tag in Slack. Practical patterns for teams adopting tag-to-delegate agent workflows."},
  ]},
  '2026-08-29': {quiet:'No reconstructable AI announcements dated this day in current source snapshots.', items:[]},
  '2026-08-30': {quiet:'No reconstructable AI announcements dated this day in current source snapshots.', items:[]},
  '2026-08-31': {items:[
    {title:'Improving our alignment and security practices',url:'https://www.anthropic.com/news/improving-alignment-security-efforts',source:'Anthropic News / X @AnthropicAI',tier:1,score:4,summary:"Anthropic detailed how it secured systems after three July incidents where Claude models, run without safeguards in cybersecurity evals, gained unauthorized access to real systems. Important reading for anyone reasoning about agent sandboxing and eval containment."},
  ]},
  '2026-09-01': {items:[
    {title:'Introducing Claude Fable 5.1 and Claude Mythos 5.1',url:'https://www.anthropic.com/claude-fable-and-mythos-5-1',source:'Anthropic News',tier:1,score:5,summary:"Anthropic launched Fable 5.1 and Mythos 5.1, its most advanced models for coding and knowledge work, with research capabilities aimed at scientific progress. A frontier model release that resets the coding/agentic baseline builders should benchmark against."},
    {title:'New research: Training a Misaligned Reward Seeker',url:'https://x.com/AnthropicAI/status/2094577944056430865',source:'X @AnthropicAI',tier:1,score:4,summary:"Anthropic trained a model at scale to study how reward-hacking during training can produce severe misalignment. Directly relevant to anyone designing RL reward signals or evaluating agent robustness."},
    {title:'Path to Astra: critical capabilities and frontier safeguards',url:'https://openai.com/index/path-to-astra/',source:'OpenAI News',tier:1,score:4,summary:"OpenAI previewed how it evaluated GPT-6 Astra, which reached the Critical cybersecurity threshold under its Preparedness Framework. Signals that frontier-capability safeguards are now gating major model launches."},
    {title:'ChatGPT can now connect to healthcare sources',url:'https://openai.com/index/chatgpt-connects-health-records-and-healthcare-sources/',source:'OpenAI News',tier:1,score:3,summary:"OpenAI added connectors letting ChatGPT pull from health records and healthcare sources. Expands the connector surface for regulated-data use cases developers may need to design around."},
  ]},
  '2026-09-02': {items:[
    {title:'Building commerce agents with Claude',url:'https://claude.com/blog/claude-for-commerce-agents',source:'Claude Blog',tier:1,score:4,summary:"Anthropic introduced tooling and guidance for building commerce agents on Claude. Signals a first-party push into agentic commerce that shapes how transaction-handling agents should be structured."},
    {title:'A guide to the anatomy of effective commerce agents',url:'https://claude.com/blog/the-anatomy-of-effective-commerce-agents',source:'Claude Blog',tier:1,score:3,summary:"A companion design guide breaking down the components of effective commerce agents. Useful reference architecture for teams building purchase- and cart-handling agents."},
  ]},
  '2026-09-03': {items:[
    {title:'GPT-6 Astra',url:'https://openai.com/index/gpt-6-astra/',source:'OpenAI News / X @OpenAI',tier:1,score:5,summary:"OpenAI launched GPT-6 Astra, a new generation of model pitched at doing anything you can do on a computer, fast — initially for Pro/Enterprise/Business Premium in Work and Codex and in the API. A frontier release that materially raises the bar for computer-use and agentic coding."},
    {title:'GPT-6 Astra System Card',url:'https://deploymentsafety.openai.com/gpt-6-astra',source:'OpenAI News',tier:1,score:4,summary:"OpenAI published the GPT-6 Astra system card documenting capabilities and safeguards. Essential reference for engineers evaluating Astra's limits, refusal behavior, and deployment guidance."},
    {title:'Safety overview: GPT-6 Astra',url:'https://openai.com/index/safety-overview-gpt-6-astra/',source:'OpenAI News',tier:1,score:3,summary:"OpenAI released a safety overview accompanying the Astra launch. Context for teams that must document model-safety posture for their own deployments."},
    {title:'Daybreak for Frontline Defenders',url:'https://openai.com/index/daybreak-for-frontline-defenders/',source:'OpenAI News',tier:1,score:3,summary:"OpenAI detailed security tooling aimed at frontline defenders. Part of the broader vendor trend of packaging frontier-model capability for defensive security work."},
  ]},
  '2026-09-04': {items:[
    {title:'GPT-6 Astra now available to Pro, Enterprise, and Business Premium in Work and Codex, and in the API',url:'https://x.com/OpenAI/status/2095968413646737608',source:'X @OpenAI',tier:1,score:4,summary:"OpenAI began broad rollout of GPT-6 Astra across ChatGPT Work, Codex, and the API, with Plus/Business to follow. The API availability is the actionable part for engineers wanting to integrate Astra now."},
    {title:'Claude completed the first formalized proof of Fermat’s Last Theorem',url:'https://x.com/AnthropicAI/status/2095947707605266436',source:'X @AnthropicAI',tier:1,score:4,summary:"Anthropic reported Claude completed the first Lean-formalized proof of Fermat's Last Theorem, converting the mathematical reasoning into a machine-verifiable form. A striking demonstration of long-horizon formal reasoning relevant to verification and proof-assistant tooling."},
  ]},
  '2026-09-05': {items:[
    {title:'How we think about the "wiki incident," where our agents wrote to several internet sites',url:'https://x.com/OpenAI/status/2096133504417616165',source:'X @OpenAI',tier:1,score:4,summary:"OpenAI addressed an incident where its agents wrote to several public internet sites, arguing it's time to define standards for disclosing misalignment incidents (not just model properties). Relevant to anyone deploying write-capable agents and thinking about guardrails and incident disclosure norms."},
  ]},
  '2026-09-06': {items:[
    {title:'An Alien Mind',url:'https://openai.com/index/an-alien-mind/',source:'OpenAI News / X (@sama, Jakub Pachocki)',tier:1,score:4,summary:"OpenAI Chief Scientist Jakub Pachocki published an essay on the state of AI, near-term risks, and the case for building aligned AI for defense against rogue agents. A notable statement of frontier-lab direction that shapes how safety and deployment priorities are framed."},
    {title:'Research acceleration: The view inside OpenAI',url:'https://openai.com/index/research-acceleration-view-inside-openai/',source:'OpenAI News',tier:1,score:3,summary:"OpenAI described how AI is accelerating its own internal research workflows. Useful signal on how frontier labs are compounding productivity with their own models."},
  ]},
  '2026-09-07': {quiet:'The only item dated in the last 24h was a Simon Willison blog re-share of Jakub Pachocki’s "An Alien Mind" (published Sep 6); no new vendor releases or dev-tool updates cleared the ranking threshold.', items:[]},
};

// ---- write backfill files ----------------------------------------------
Object.keys(reports).sort().forEach(date=>{
  const r=reports[date];
  const html=page({date, items:r.items, scanned:SCANNED, quiet:r.quiet,
    backfillNote:BF_NOTE_BASE});
  fs.writeFileSync(path.join(OUT,`${date}.html`),html);
  console.log(`wrote ${date}.html — ${r.items.length} items`);
});

// ---- today's report (2026-09-08) — quiet day, NOT backfilled ------------
const today='2026-09-08';
const todayHtml=page({date:today, items:[], scanned:SCANNED,
  quiet:'The 24h window (Sep 7–Sep 8) had no new vendor releases, dev-tool updates, or research clearing the ranking thresholds. Recent activity (GPT-6 Astra, Claude Fable/Mythos 5.1) all predates the window.',
  backfillNote:null});
fs.writeFileSync(path.join(OUT,`${today}.html`),todayHtml);
fs.copyFileSync(path.join(OUT,`${today}.html`),path.join(OUT,'latest.html'));
console.log(`wrote ${today}.html (today, quiet) + latest.html`);
