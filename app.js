import { initStore } from './store.js';
import { DEFAULT_PROGRAM, DEFAULT_RECIPES, SUGGESTED_RECIPES } from './seed.js';
import { builtinPhoto } from './images.js';
import {
  DAYS, MEALS, UNITS, iso, fromIso, dow, num, planningWeek, shiftWeek,
  convWeight, entryStats, isMain, coverage, buildPlan, shoppingItems, OP, applyPatch,
} from './logic.js';

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const rid = () => Math.random().toString(36).slice(2, 10);
const clone = o => JSON.parse(JSON.stringify(o));
const today = () => iso(new Date());
const shortDate = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const parseNum = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : null; };

// ---------- state ----------
const S = {
  tab: 'gym', mealsTab: 'plan', gymDay: dow(), weekId: planningWeek(),
  user: undefined, profile: null, logs: null, diet: null, week: undefined, // week: undefined = still loading
  progEx: null, metric: 'top', extraSets: {}, moving: null, lastSwipe: null, editProgram: false, progDay: dow(),
  itemDraft: '', error: '', photos: {},
};
let store, unsubs = [], unsubWeek = null, dirty = false, lastDay = today(), dietDoc = null;
const photoSubs = new Map(); // recipe id → stop watching its photo

const unit = () => S.profile.unit || 'lb';
const shopSystem = () => S.profile.shopUnits || 'metric';
const target = () => S.diet.mealsPerWeek || 14;
const recipe = id => S.diet.recipes.find(r => r.id === id);
// Own documents (settings, workout plan, logged sets) are saved whole; the shared ones (recipes, weeks)
// only through patches, so the two accounts never overwrite each other.
const saveProfile = p => { S.profile = p; store.save(`users/${S.user.uid}`, p); };
const saveLogs = l => { S.logs = l; store.save(`users/${S.user.uid}/data/logs`, l); };
const updateWeek = patch => { S.week = applyPatch(S.week, patch); store.update(`weeks/${S.weekId}`, patch); render(true); };
const updateDiet = patch => { setDiet(applyPatch(dietDoc, patch)); store.update('shared/diet', patch); render(true); };
// stored: recipes as a map by id (so one recipe can change alone); in memory: a list in creation order
function setDiet(doc) {
  dietDoc = doc;
  S.diet = { ...doc, recipes: Object.values(doc.recipes || {}).sort((a, b) => (a.o ?? 0) - (b.o ?? 0) || String(a.name).localeCompare(b.name)) };
  // a recipe's own photo lives in its own document (photos/<id>), loaded only for the recipes that have one
  const want = new Set(S.diet.recipes.filter(r => r.photo).map(r => r.id));
  for (const [id, stop] of photoSubs) if (!want.has(id)) { stop(); photoSubs.delete(id); delete S.photos[id]; }
  for (const id of want) if (!photoSubs.has(id)) {
    photoSubs.set(id, () => {}); // placeholder: a local watch answers before watch() returns
    photoSubs.set(id, store.watch(`photos/${id}`, d => { if (d?.data) { S.photos[id] = d.data; render(); } }));
  }
}

// ---------- photos ----------
const photoUrl = (r, size) => (r.photo && S.photos[r.id]) || builtinPhoto(r.id, size);
// A tile with the dish's initial; the photo covers it once loaded and removes itself if it cannot load.
function pic(r, cls, size = 'thumb') {
  const url = photoUrl(r, size);
  return `<span class="pic ${cls}" aria-hidden="true">${esc((r.name || '?').trim()[0] || '?')}${url
    ? `<img src="${esc(url)}" alt="" loading="lazy" draggable="false" ${url.startsWith('data:') ? '' : 'crossorigin="anonymous"'} onerror="this.remove()">` : ''}</span>`;
}
function resizeImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const s = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s));
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')); };
    im.src = url;
  });
}

// ---------- data wiring ----------
// A snapshot that still has pending local writes is older or equal to what is already on screen: skip it,
// the confirmed one follows.
function subscribe() {
  const uid = S.user.uid;
  const failed = () => { S.error = 'Could not load your data. Check that this account has access, then sign in again.'; render(true); };
  unsubs.push(store.watch(`users/${uid}`, (d, cached, pending) => {
    if (pending && S.profile) return;
    if (!d) { if (!cached) store.save(`users/${uid}`, { name: S.user.name, unit: 'lb', shopUnits: 'metric', program: clone(DEFAULT_PROGRAM) }); return; }
    S.profile = d; render();
  }, failed));
  unsubs.push(store.watch(`users/${uid}/data/logs`, (d, cached, pending) => {
    if (pending && S.logs) return;
    S.logs = d || {}; render();
  }, failed));
  unsubs.push(store.watch('shared/diet', (d, cached, pending) => {
    if (pending && S.diet) return;
    if (!d) {
      if (!cached) store.save('shared/diet', { mealsPerWeek: 14, recipes: Object.fromEntries(DEFAULT_RECIPES.map((r, i) => [r.id, { ...clone(r), o: i }])) });
      return;
    }
    setDiet(d); render();
  }, failed));
  watchWeek();
}
function watchWeek() {
  unsubWeek?.();
  S.week = undefined;
  const id = S.weekId;
  unsubWeek = store.watch(`weeks/${id}`, (d, cached, pending) => {
    if (id !== S.weekId || (pending && S.week !== undefined)) return;
    S.week = d; render();
  });
}
function unsubscribe() {
  unsubs.forEach(u => u()); unsubs = [];
  unsubWeek?.(); unsubWeek = null;
  photoSubs.forEach(stop => stop()); photoSubs.clear(); S.photos = {};
  S.profile = S.logs = S.diet = dietDoc = null; S.week = undefined; S.itemDraft = S.error = '';
  S.moving = S.lastSwipe = S.progEx = null; S.extraSets = {}; S.editProgram = false;
  S.tab = 'gym'; S.mealsTab = 'plan'; S.metric = 'top'; S.gymDay = S.progDay = dow(); S.weekId = planningWeek();
}

// ---------- rendering ----------
const ICONS = {
  gym: '<path d="M4 9v6M7 6v12M17 6v12M20 9v6M7 12h10"/>',
  progress: '<path d="M4 19V5M4 19h16M8 15l4-5 3 3 4-6"/>',
  meals: '<path d="M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 3c-2 2-3 5-3 8h3v10"/>',
  shop: '<path d="M4 5h2l2 11h10l2-8H7M9 20h.01M17 20h.01"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
};
const TABS = [['gym', 'Workout'], ['progress', 'Progress'], ['meals', 'Meals'], ['shop', 'Shopping'], ['me', 'Settings']];
const LOADING = '<div class="loading">Loading…</div>';

// Re-rendering replaces the DOM, so while a field has the focus it waits until the field is left.
function render(force) {
  const a = document.activeElement;
  if (!force && a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && $('#app').contains(a)) { dirty = true; return; }
  dirty = false;
  const app = $('#app');
  if (S.user === undefined) { app.innerHTML = LOADING; return; }
  if (S.user === null) { app.innerHTML = viewLogin(); return; }
  if (S.error) { app.innerHTML = `<div class="login"><p class="error">${esc(S.error)}</p><button class="btn" data-act="signOut">Sign out</button></div>`; return; }
  if (!S.profile || !S.logs || !S.diet) { app.innerHTML = LOADING; return; }
  const view = { gym: viewGym, progress: viewProgress, meals: viewMeals, shop: viewShop, me: viewMe }[S.tab]();
  const scroll = $('main')?.scrollTop || 0;
  app.innerHTML = `
    <main>${view}</main>
    <nav class="tabs">${TABS.map(([k, label]) => `
      <button class="${S.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>
        <span>${label}</span>
      </button>`).join('')}
    </nav>`;
  $('main').scrollTop = scroll;
  bindSwipe();
}
document.addEventListener('focusout', () => setTimeout(() => { if (dirty) render(); }, 60));
document.addEventListener('visibilitychange', () => {
  if (document.hidden || today() === lastDay) return;
  // the app was left open overnight: move to the new day
  const was = planningWeek(fromIso(lastDay));
  lastDay = today(); S.gymDay = dow(); S.extraSets = {}; S.moving = null;
  closeSheet();
  if (S.user && S.weekId === was && was !== planningWeek()) { S.weekId = planningWeek(); watchWeek(); }
  render(true);
});

function viewLogin() {
  if (store.mode === 'local') return `
    <div class="login">
      <h1>FitPlan</h1>
      <p class="muted">Who is it?</p>
      <button class="btn primary" data-act="localLogin" data-uid="michele">Michele</button>
      <button class="btn primary" data-act="localLogin" data-uid="lucy">Lucy</button>
      <p class="muted small">Local mode: data is saved on this device only.</p>
    </div>`;
  return `
    <form class="login" id="loginForm">
      <h1>FitPlan</h1>
      <p class="muted">Sign in to your account</p>
      <input type="email" name="email" placeholder="Email" autocomplete="username" autocapitalize="off" required>
      <input type="password" name="password" placeholder="Password" autocomplete="current-password" required>
      <p class="error" id="loginErr"></p>
      <button class="btn primary">Sign in</button>
    </form>`;
}

// ---------- gym ----------
const setsText = (e, to) => entryStats(e, to).sets.map(s => `${s.w != null ? num(convWeight(s.w, e.u, to)) : 'BW'}×${s.r}`).join('  ');

function viewGym() {
  const day = S.profile.program[S.gymDay];
  return `
    <header><p class="eyebrow">Hi ${esc(S.profile.name)}</p><h1>${esc(DAYS[S.gymDay])} · ${esc(day.title || 'Workout')}</h1></header>
    <div class="chips">${DAYS.map((n, i) => `<button class="chip ${i === S.gymDay ? 'on' : ''} ${i === dow() ? 'today' : ''}" data-act="gymDay" data-i="${i}">${n.slice(0, 3)}</button>`).join('')}</div>
    ${S.gymDay !== dow() && day.exercises.length ? `<p class="note">Sets you enter are logged with today's date.</p>` : ''}
    ${day.exercises.length ? day.exercises.map(exCard).join('') : `<div class="empty"><h2>Rest day</h2><p class="muted">Nothing scheduled. Recover well.</p></div>`}`;
}

function exCard(ex) {
  const u = unit(), t = today();
  const entries = S.logs[ex.id] || [];
  const cur = entries.find(e => e.d === t);
  const prev = entries.filter(e => e.d < t && entryStats(e, u).sets.length).pop();
  const n = Math.max((Number(ex.sets) || 1) + (S.extraSets[ex.id] || 0), cur?.sets.length || 0);
  let rows = '';
  for (let i = 0; i < n; i++) {
    const cs = cur?.sets[i], ps = prev?.sets[i];
    rows += `
      <div class="set ${cs && cs.r > 0 ? 'done' : ''}">
        <span class="set-n">${i + 1}</span>
        <input inputmode="decimal" data-chg="set" data-ex="${esc(ex.id)}" data-i="${i}" data-f="w" aria-label="Weight, set ${i + 1}"
          value="${cs?.w != null ? num(convWeight(cs.w, cur.u, u)) : ''}" placeholder="${ps?.w != null ? num(convWeight(ps.w, prev.u, u)) : u}">
        <span class="x">×</span>
        <input inputmode="numeric" data-chg="set" data-ex="${esc(ex.id)}" data-i="${i}" data-f="r" aria-label="Reps, set ${i + 1}"
          value="${cs?.r ?? ''}" placeholder="${ps?.r ?? 'reps'}">
      </div>`;
  }
  return `
    <section class="card">
      <div class="card-head">
        <div><h2>${esc(ex.name || 'Exercise')}</h2><p class="muted">${esc(ex.sets)} × ${esc(ex.reps)} · ${u}</p></div>
        <button class="link" data-act="openProgress" data-ex="${esc(ex.id)}">History</button>
      </div>
      ${ex.note ? `<p class="exnote">${esc(ex.note)}</p>` : ''}
      ${prev ? `<p class="last">Last · ${shortDate(fromIso(prev.d))} · ${esc(setsText(prev, u))}</p>` : ''}
      ${rows}
      <button class="link add" data-act="addSet" data-ex="${esc(ex.id)}">+ Add set</button>
    </section>`;
}

// ---------- progress ----------
function allExercises() {
  const seen = new Set(), out = [];
  S.profile.program.forEach((d, i) => d.exercises.forEach(e => {
    if (!seen.has(e.id)) { seen.add(e.id); out.push({ ...e, day: DAYS[i].slice(0, 3) }); }
  }));
  return out;
}

function viewProgress() {
  const exs = allExercises(), u = unit();
  if (!exs.length) return `<header><h1>Progress</h1></header><div class="empty"><p class="muted">No exercises in your plan yet.</p></div>`;
  if (!exs.some(e => e.id === S.progEx)) S.progEx = (exs.find(e => (S.logs[e.id] || []).length) || exs[0]).id;
  const entries = (S.logs[S.progEx] || []).map(e => ({ e, s: entryStats(e, u) })).filter(x => x.s.sets.length);
  const metrics = { top: ['Top weight', u], reps: ['Total reps', 'reps'], vol: ['Volume', u] };
  const pts = entries.map(x => ({ d: x.e.d, v: x.s[S.metric] }));
  return `
    <header><h1>Progress</h1></header>
    <select class="select" data-chg="progEx" aria-label="Exercise">${exs.map(e => `<option value="${esc(e.id)}" ${e.id === S.progEx ? 'selected' : ''}>${esc(e.day)} · ${esc(e.name || 'Exercise')}</option>`).join('')}</select>
    <div class="seg">${Object.entries(metrics).map(([k, [label]]) => `<button class="${S.metric === k ? 'on' : ''}" data-act="metric" data-m="${k}">${label}</button>`).join('')}</div>
    <section class="card">
      ${pts.length ? chart(pts, metrics[S.metric][1]) : `<p class="muted center">No sets logged for this exercise yet.</p>`}
    </section>
    ${entries.length ? `<section class="card"><h2>History</h2>${[...entries].reverse().map(x => `
      <div class="hist"><span>${shortDate(fromIso(x.e.d))}</span><span>${esc(setsText(x.e, u))}</span></div>`).join('')}</section>` : ''}`;
}

function chart(pts, label) {
  const W = 320, H = 170, L = 40, R = 14, T = 16, B = 26;
  const vs = pts.map(p => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (lo === hi) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
  const x = i => pts.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1);
  const y = v => T + (hi - v) * (H - T - B) / (hi - lo);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
  const first = pts[0], last = pts[pts.length - 1];
  const delta = last.v - first.v;
  const r = pts.length > 40 ? 0 : pts.length > 20 ? 2 : 3.5;
  return `
    <div class="chart-head"><strong>${num(last.v)} ${esc(label)}</strong>
      ${pts.length > 1 ? `<span class="${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${num(delta)} since ${shortDate(fromIso(first.d))}</span>` : ''}</div>
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progress chart">
      ${[hi - pad, (hi + lo) / 2, lo + pad].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="grid"/><text x="${L - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${num(Math.round(v * 10) / 10)}</text>`).join('')}
      <path d="${line}" class="line"/>
      ${r ? pts.map((p, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(p.v).toFixed(1)}" r="${r}" class="dot"/>`).join('') : ''}
      <text x="${L}" y="${H - 6}">${shortDate(fromIso(first.d))}</text>
      ${pts.length > 1 ? `<text x="${W - R}" y="${H - 6}" text-anchor="end">${shortDate(fromIso(last.d))}</text>` : ''}
    </svg>`;
}

// ---------- meals ----------
function weekNav() {
  const start = fromIso(S.weekId), end = fromIso(S.weekId); end.setDate(end.getDate() + 6);
  return `<div class="weeknav"><button data-act="week" data-n="-1" aria-label="Previous week">‹</button>
    <span>${shortDate(start)} – ${shortDate(end)}${S.weekId === planningWeek() ? '' : ` <button class="link" data-act="weekNow">Back</button>`}</span>
    <button data-act="week" data-n="1" aria-label="Next week">›</button></div>`;
}
const ingList = r => `<ul class="ings">${r.ingredients.map(i => `<li><span>${esc(i.name)}</span><span class="muted">${esc(num(i.qty))} ${esc(i.unit)}</span></li>`).join('')}</ul>`;

function viewMeals() {
  const sub = S.mealsTab === 'recipes' ? viewRecipes() : S.week === undefined ? LOADING : S.mealsTab === 'pick' ? viewPick() : viewPlan();
  return `
    <header><h1>Meals</h1></header>
    <div class="seg">${[['plan', 'Week'], ['pick', 'Pick'], ['recipes', 'Recipes']].map(([k, l]) => `<button class="${S.mealsTab === k ? 'on' : ''}" data-act="mealsTab" data-t="${k}">${l}</button>`).join('')}</div>
    ${S.mealsTab !== 'recipes' ? weekNav() : ''}
    ${sub}`;
}

function viewPlan() {
  const w = S.week;
  if (!w?.plan) return `<div class="empty"><h2>No plan for this week</h2><p class="muted">Swipe through the recipes and pick what you feel like eating.</p>
    <button class="btn primary" data-act="mealsTab" data-t="pick">Pick meals</button></div>`;
  const start = fromIso(S.weekId);
  return `
    ${S.moving ? `<p class="note sticky">Tap another ${S.moving.m === 'b' ? 'breakfast' : 'lunch or dinner'} to swap. <button class="link" data-act="cancelMove">Cancel</button></p>` : ''}
    ${w.plan.map((day, d) => {
      const date = new Date(start); date.setDate(date.getDate() + d);
      return `<section class="card day"><h2>${DAYS[d]} <span class="muted">${shortDate(date)}</span></h2>
        ${Object.keys(MEALS).map(m => {
          const r = recipe(day[m]);
          const moving = S.moving && S.moving.d === d && S.moving.m === m;
          return `<button class="slot ${moving ? 'moving' : ''}" data-act="slot" data-d="${d}" data-m="${m}">
            <span class="slot-k">${MEALS[m]}</span>${r ? pic(r, 'sm') : ''}<span class="slot-v ${r ? '' : 'muted'}">${r ? esc(r.name) : 'Empty'}</span>
            ${r && day.left?.[m] ? '<span class="tag">Leftovers</span>' : ''}</button>`;
        }).join('')}</section>`;
    }).join('')}`;
}

function viewPick() {
  const w = S.week || {};
  const liked = [...new Set(w.liked || [])].filter(id => recipe(id) && isMain(recipe(id)));
  const covered = coverage(liked, S.diet.recipes);
  const deck = S.diet.recipes.filter(r => isMain(r) && !liked.includes(r.id) && !(w.passed || []).includes(r.id));
  const head = `<p class="pick-count"><strong>${Math.min(covered, target())}</strong> of ${target()} lunches and dinners covered</p>
    <div class="bar"><i style="width:${Math.min(100, covered / target() * 100)}%"></i></div>`;
  const picked = liked.length ? `<section class="card"><h2>Picked</h2>${liked.map(id => `
    <div class="slot">${pic(recipe(id), 'sm')}<span class="slot-v">${esc(recipe(id).name)}</span>${recipe(id).leftovers ? '<span class="tag">Leftovers</span>' : ''}
    <button class="link danger" data-act="unpick" data-id="${esc(id)}" aria-label="Remove ${esc(recipe(id).name)}">✕</button></div>`).join('')}</section>` : '';
  if (covered >= target()) return `${head}<div class="empty"><h2>Week picked</h2>
    <button class="btn primary" data-act="rebuild">${w.plan ? 'Rebuild week plan' : 'Build week plan'}</button>
    <button class="btn" data-act="resetPicks">Start over</button></div>${picked}`;
  if (!deck.length) return `${head}<div class="empty"><h2>No more recipes</h2><p class="muted">You went through every recipe.</p>
    ${liked.length ? `<button class="btn primary" data-act="rebuild">Build the week with these ${liked.length}</button>` : ''}
    ${(w.passed || []).length ? `<button class="btn" data-act="resetPassed">See skipped recipes again</button>` : ''}
    <button class="btn" data-act="newRecipe">Add a recipe</button></div>${picked}`;
  const r = deck[0];
  return `${head}
    <div class="deck">
      ${deck[1] ? `<div class="swipe-card under">${pic(deck[1], 'hero', 'card')}</div>` : ''}
      <div class="swipe-card" data-id="${esc(r.id)}">
        ${pic(r, 'hero', 'card')}
        <span class="stamp yes">YES</span><span class="stamp no">NOPE</span>
        <div class="swipe-body">
          <h2>${esc(r.name)}</h2>
          ${r.leftovers ? '<p><span class="tag">Leftovers · covers 2 meals</span></p>' : ''}
          ${ingList(r)}
          ${r.steps ? `<p class="muted steps">${esc(r.steps)}</p>` : ''}
        </div>
      </div>
    </div>
    <div class="swipe-btns">
      <button class="round no" data-act="swipe" data-yes="0" aria-label="Skip">✕</button>
      ${S.lastSwipe && S.lastSwipe.week === S.weekId ? `<button class="link" data-act="undoSwipe">Undo</button>` : ''}
      <button class="round yes" data-act="swipe" data-yes="1" aria-label="Pick">♥</button>
    </div>
    ${picked}`;
}

function viewRecipes() {
  const group = (title, list) => list.length ? `<section class="card"><h2>${title}</h2>${list.map(r => `
    <button class="slot" data-act="editRecipe" data-id="${esc(r.id)}">${pic(r, 'md')}<span class="slot-v">${esc(r.name)}</span>
    ${r.leftovers && isMain(r) ? '<span class="tag">Leftovers</span>' : ''}<span class="muted">${r.ingredients.length} ingr.</span></button>`).join('')}</section>` : '';
  const sorted = [...S.diet.recipes].sort((a, b) => a.name.localeCompare(b.name));
  const ideas = suggestions();
  return `<button class="btn primary" data-act="newRecipe">+ New recipe</button>
    ${group('Lunch & dinner', sorted.filter(isMain))}
    ${group('Breakfast', sorted.filter(r => !isMain(r)))}
    ${ideas.length ? `<section class="card"><div class="card-head"><div><h2>Suggested</h2><p class="muted">Ideas you can add to your recipes</p></div>
      <button class="link" data-act="addAllSuggested">Add all</button></div>${ideas.map(r => `
      <div class="slot" role="button" tabindex="0" data-act="viewSuggested" data-id="${esc(r.id)}">${pic(r, 'md')}<span class="slot-v">${esc(r.name)}</span>
      <button class="link" data-act="addSuggested" data-id="${esc(r.id)}" aria-label="Add ${esc(r.name)}">Add</button></div>`).join('')}</section>` : ''}`;
}
// built-in ideas that are not in the recipes yet
const suggestions = () => SUGGESTED_RECIPES.filter(s => !recipe(s.id));

function bindSwipe() {
  const c = $('.swipe-card:not(.under)');
  if (!c) return;
  let x0 = null, dx = 0;
  c.onpointerdown = e => { x0 = e.clientX; dx = 0; c.setPointerCapture?.(e.pointerId); c.style.transition = 'none'; };
  c.onpointermove = e => {
    if (x0 == null) return;
    dx = e.clientX - x0;
    c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    c.dataset.dir = dx > 40 ? 'yes' : dx < -40 ? 'no' : '';
  };
  c.onpointerup = c.onpointercancel = e => {
    if (x0 == null) return;
    x0 = null;
    if (e.type === 'pointerup' && Math.abs(dx) > 90) fling(dx > 0);
    else { c.style.transition = ''; c.style.transform = ''; c.dataset.dir = ''; }
  };
}
function fling(yes) {
  const c = $('.swipe-card:not(.under)');
  if (!c || c.dataset.gone) return;
  c.dataset.gone = '1'; c.dataset.dir = yes ? 'yes' : 'no';
  c.style.transition = 'transform .25s ease-out, opacity .25s';
  c.style.transform = `translateX(${yes ? 480 : -480}px) rotate(${yes ? 24 : -24}deg)`;
  c.style.opacity = '0';
  const id = c.dataset.id, week = S.weekId;
  setTimeout(() => {
    if (week !== S.weekId || S.week === undefined || !recipe(id)) return render(true);
    const liked = S.week?.liked || [], passed = S.week?.passed || [];
    if (liked.includes(id) || passed.includes(id)) return render(true);
    const patch = yes ? { liked: OP.union([id]) } : { passed: OP.union([id]) };
    S.lastSwipe = { id, week };
    if (yes && coverage([...liked, id], S.diet.recipes) >= target()) {
      patch.plan = buildPlan([...liked, id], S.diet.recipes); patch.checked = []; S.mealsTab = 'plan'; S.lastSwipe = null;
    }
    updateWeek(patch);
  }, 230);
}

// ---------- shopping ----------
function viewShop() {
  if (S.week === undefined) return `<header><h1>Shopping list</h1></header>${weekNav()}${LOADING}`;
  const w = S.week || {};
  const checked = w.checked || [];
  const items = [
    ...shoppingItems(w.plan, S.diet.recipes, shopSystem()).map(i => ({ ...i, text: `${num(i.qty)} ${i.unit}`.trim() })),
    ...(w.extra || []).map(x => ({ key: 'x|' + x.id, name: x.name, text: '', extra: x.id })),
  ];
  const row = it => `<div class="shop ${checked.includes(it.key) ? 'checked' : ''}" role="button" tabindex="0" data-act="check" data-key="${esc(it.key)}">
    <i class="box"></i><span class="shop-n">${esc(it.name)}</span><span class="muted">${esc(it.text)}</span>
    ${it.extra ? `<button class="link danger" data-act="extraDel" data-id="${esc(it.extra)}" aria-label="Remove ${esc(it.name)}">✕</button>` : ''}</div>`;
  const todo = items.filter(i => !checked.includes(i.key)), done = items.filter(i => checked.includes(i.key));
  return `
    <header><h1>Shopping list</h1></header>
    ${weekNav()}
    <div class="shop-top"><p class="muted small">For two people · ${todo.length} to buy</p>
      <div class="seg inline">${[['metric', 'g'], ['us', 'oz']].map(([k, l]) => `<button class="${shopSystem() === k ? 'on' : ''}" data-act="shopUnits" data-u="${k}">${l}</button>`).join('')}</div></div>
    <form id="addItem" class="additem"><input name="item" data-chg="itemDraft" value="${esc(S.itemDraft)}" placeholder="Add an item" maxlength="60" aria-label="Add an item" autocomplete="off"><button class="btn primary">Add</button></form>
    ${!w.plan && !items.length ? `<div class="empty"><h2>Nothing to buy yet</h2><p class="muted">The list is built from the week plan.</p>
      <button class="btn primary" data-act="goPick">Pick meals</button></div>` : ''}
    ${items.length ? `<section class="card list">${todo.map(row).join('') || '<p class="muted center pad">All done.</p>'}</section>` : ''}
    ${done.length ? `<section class="card list">${done.map(row).join('')}</section>` : ''}
    ${todo.length ? `<button class="btn" data-act="copyList">Copy list</button>` : ''}`;
}

// ---------- settings ----------
function viewMe() {
  if (S.editProgram) return viewProgram();
  return `
    <header><h1>Settings</h1></header>
    <section class="card">
      <label class="field"><span>Name</span><input data-chg="name" value="${esc(S.profile.name)}" maxlength="30"></label>
      <div class="field"><span>Weight unit</span>
        <div class="seg inline">${['lb', 'kg'].map(u => `<button class="${unit() === u ? 'on' : ''}" data-act="unit" data-u="${u}">${u}</button>`).join('')}</div></div>
    </section>
    <section class="card">
      <div class="field"><span>Lunches and dinners to plan</span>
        <div class="stepper"><button data-act="mealsPerWeek" data-n="-1" aria-label="Fewer">−</button><strong>${target()}</strong><button data-act="mealsPerWeek" data-n="1" aria-label="More">+</button></div></div>
      <p class="muted small">How many meals you pick each week. Shared with the other account, like recipes and the week plan.</p>
    </section>
    <button class="btn" data-act="editProgram">Edit workout plan</button>
    <button class="btn" data-act="resetProgram">Reset workout plan to default</button>
    <button class="btn" data-act="signOut">${store.mode === 'local' ? 'Switch account' : 'Sign out'}</button>
    ${store.mode === 'local' ? `<p class="muted small center">Local mode: data is saved on this device only.</p>` : ''}`;
}

function viewProgram() {
  const day = S.profile.program[S.progDay];
  return `
    <header><button class="link" data-act="closeProgram">‹ Settings</button><h1>Workout plan</h1></header>
    <div class="chips">${DAYS.map((n, i) => `<button class="chip ${i === S.progDay ? 'on' : ''}" data-act="progDay" data-i="${i}">${n.slice(0, 3)}</button>`).join('')}</div>
    <section class="card">
      <label class="field"><span>Day name</span><input data-chg="dayTitle" value="${esc(day.title)}" placeholder="e.g. Quads" maxlength="40"></label>
    </section>
    ${day.exercises.map((e, i) => `
      <section class="card prog">
        <input class="wide" data-chg="prog" data-i="${i}" data-f="name" value="${esc(e.name)}" placeholder="Exercise name" aria-label="Exercise name" maxlength="60">
        <input data-chg="prog" data-i="${i}" data-f="note" value="${esc(e.note)}" placeholder="Note (optional)" aria-label="Note" maxlength="140">
        <div class="prog-row">
          <label>Sets<input inputmode="numeric" data-chg="prog" data-i="${i}" data-f="sets" value="${esc(e.sets)}"></label>
          <label>Reps<input data-chg="prog" data-i="${i}" data-f="reps" value="${esc(e.reps)}" maxlength="20"></label>
          <button class="link" data-act="exMove" data-i="${i}" ${i ? '' : 'disabled'}>Up</button>
          <button class="link danger" data-act="exDel" data-i="${i}">Remove</button>
        </div>
      </section>`).join('')}
    <button class="btn primary" data-act="exAdd">+ Add exercise</button>`;
}

// ---------- sheets ----------
function openSheet(html) {
  const s = $('#sheet');
  s.innerHTML = `<div class="backdrop" data-act="closeSheet"></div><div class="panel">${html}</div>`;
  s.hidden = false;
}
function closeSheet() { $('#sheet').hidden = true; $('#sheet').innerHTML = ''; }

const unitSelect = u => {
  u = String(u ?? '').trim();
  const opts = UNITS.includes(u) ? UNITS : [...UNITS, u];
  return `<select class="in-unit" aria-label="Unit">${opts.map(o => `<option value="${esc(o)}" ${o === u ? 'selected' : ''}>${o ? esc(o) : 'pcs'}</option>`).join('')}</select>`;
};
const ingRow = (i = {}) => `<div class="ing">
  <input class="in-name" placeholder="Ingredient" value="${esc(i.name)}" aria-label="Ingredient" maxlength="60">
  <input class="in-qty" inputmode="decimal" placeholder="Qty" value="${esc(i.qty)}" aria-label="Quantity">
  ${unitSelect(i.unit)}
  <button type="button" class="link danger" data-act="ingDel" aria-label="Remove ingredient">✕</button></div>`;

function recipeSheet(r) {
  const isNew = !r;
  r = r || { id: '', name: '', type: 'main', ingredients: [{}, {}, {}], steps: '', leftovers: false };
  openSheet(`
    <form id="recipeForm" data-id="${esc(r.id)}" novalidate>
      <div class="sheet-head"><h2>${isNew ? 'New recipe' : 'Edit recipe'}</h2><button type="button" class="link" data-act="closeSheet">Cancel</button></div>
      <label class="field col"><span>Name</span><input name="name" value="${esc(r.name)}" placeholder="e.g. Bolognese" maxlength="80"></label>
      <div class="field col"><span>Photo (optional)</span>
        <div class="photo-row">${pic(r, 'lg')}
          <label class="btn">Choose photo<input type="file" name="photo" accept="image/*" data-chg="photoPick" hidden></label>
          ${r.photo ? `<button type="button" class="link danger" data-act="photoRemove">Remove</button>` : ''}</div></div>
      <label class="field col"><span>Meal</span><select name="type" class="select">
        <option value="main" ${isMain(r) ? 'selected' : ''}>Lunch & dinner</option>
        <option value="breakfast" ${isMain(r) ? '' : 'selected'}>Breakfast</option></select></label>
      <div class="field col"><span>Ingredients · quantities for two people</span>
        <div id="ings">${r.ingredients.map(ingRow).join('')}</div>
        <button type="button" class="link add" data-act="ingAdd">+ Add ingredient</button></div>
      <label class="check"><input type="checkbox" name="leftovers" ${r.leftovers ? 'checked' : ''}>
        <span>Makes leftovers<small>Dinner one day, lunch the next. The shopping list buys double.</small></span></label>
      <label class="field col"><span>How to make it (optional)</span><textarea name="steps" rows="4" maxlength="4000">${esc(r.steps)}</textarea></label>
      <p class="error" id="recipeErr"></p>
      <button class="btn primary">Save recipe</button>
      ${isNew ? '' : `<button type="button" class="btn danger" data-act="recipeDel" data-id="${esc(r.id)}">Delete recipe</button>`}
    </form>`);
}

function slotSheet(d, m) {
  const day = S.week.plan[d], r = recipe(day[m]);
  const options = S.diet.recipes.filter(x => (m === 'b') === !isMain(x) && x.id !== r?.id).sort((a, b) => a.name.localeCompare(b.name));
  openSheet(`
    <div class="sheet-head"><div><p class="eyebrow">${DAYS[d]} · ${MEALS[m]}${r && day.left?.[m] ? ' · Leftovers' : ''}</p><h2>${r ? esc(r.name) : 'Empty'}</h2></div><button class="link" data-act="closeSheet">Close</button></div>
    ${r ? `${pic(r, 'hero sheet-hero', 'card')}${ingList(r)}
      ${r.steps ? `<p class="steps">${esc(r.steps)}</p>` : ''}
      <div class="row2"><button class="btn primary" data-act="startMove" data-d="${d}" data-m="${m}">Move / swap</button>
      <button class="btn" data-act="setSlot" data-d="${d}" data-m="${m}" data-id="">Remove</button></div>` : ''}
    <h3>${r ? 'Replace with' : 'Choose a recipe'}</h3>
    ${options.map(x => `<button class="slot" data-act="setSlot" data-d="${d}" data-m="${m}" data-id="${esc(x.id)}"><span class="slot-v">${esc(x.name)}</span></button>`).join('') || '<p class="muted">No other recipes.</p>'}`);
}

// ---------- actions ----------
const setLeft = (day, m, v) => { day.left = day.left || {}; if (v) day.left[m] = true; else delete day.left[m]; };
const go = (tab, top = true) => { S.tab = tab; S.editProgram = false; S.moving = null; render(true); if (top && $('main')) $('main').scrollTop = 0; };

const A = {
  tab: el => go(el.dataset.tab),
  localLogin: el => store.signIn(el.dataset.uid),
  signOut: () => { closeSheet(); S.tab = 'gym'; store.signOut(); },
  closeSheet,

  gymDay: el => { S.gymDay = +el.dataset.i; render(true); },
  addSet: el => { S.extraSets[el.dataset.ex] = (S.extraSets[el.dataset.ex] || 0) + 1; render(true); },
  openProgress: el => { S.progEx = el.dataset.ex; go('progress'); },
  metric: el => { S.metric = el.dataset.m; render(true); },

  mealsTab: el => { S.mealsTab = el.dataset.t; S.moving = null; render(true); },
  goPick: () => { S.mealsTab = 'pick'; go('meals'); },
  week: el => { S.weekId = shiftWeek(S.weekId, +el.dataset.n); S.moving = null; watchWeek(); render(true); },
  weekNow: () => { S.weekId = planningWeek(); S.moving = null; watchWeek(); render(true); },
  swipe: el => fling(el.dataset.yes === '1'),
  undoSwipe: () => {
    const id = S.lastSwipe?.id;
    S.lastSwipe = null;
    if (!id || S.week === undefined) return render(true);
    updateWeek({ liked: OP.remove([id]), passed: OP.remove([id]) });
  },
  unpick: el => { S.lastSwipe = null; updateWeek({ liked: OP.remove([el.dataset.id]) }); },
  rebuild: () => { S.mealsTab = 'plan'; updateWeek({ plan: buildPlan(S.week?.liked || [], S.diet.recipes), checked: [] }); $('main').scrollTop = 0; },
  resetPicks: () => { S.lastSwipe = null; updateWeek({ liked: [], passed: [] }); },
  resetPassed: () => updateWeek({ passed: [] }),
  slot: el => {
    const d = +el.dataset.d, m = el.dataset.m;
    if (!S.week?.plan) return;
    if (!S.moving) return slotSheet(d, m);
    const a = S.moving;
    if ((a.m === 'b') !== (m === 'b')) return; // breakfasts swap with breakfasts only
    S.moving = null;
    if (a.d === d && a.m === m) return render(true);
    const plan = clone(S.week.plan), pa = plan[a.d], pb = plan[d];
    const la = !!pa.left?.[a.m], lb = !!pb.left?.[m];
    [pa[a.m], pb[m]] = [pb[m], pa[a.m]];
    setLeft(pa, a.m, lb); setLeft(pb, m, la);
    updateWeek({ plan });
  },
  startMove: el => { S.moving = { d: +el.dataset.d, m: el.dataset.m }; closeSheet(); render(true); },
  cancelMove: () => { S.moving = null; render(true); },
  setSlot: el => {
    closeSheet();
    if (!S.week?.plan) return;
    const plan = clone(S.week.plan), day = plan[+el.dataset.d], id = el.dataset.id || null;
    day[el.dataset.m] = id; setLeft(day, el.dataset.m, false);
    const patch = { plan };
    // the new dish adds to what must be bought: its ingredients go back to "to buy"
    const keys = id ? shoppingItems([{ l: id }], S.diet.recipes).map(i => i.key).filter(k => (S.week.checked || []).includes(k)) : [];
    if (keys.length) patch.checked = OP.remove(keys);
    updateWeek(patch);
  },

  newRecipe: () => recipeSheet(null),
  editRecipe: el => { const r = recipe(el.dataset.id); if (r) recipeSheet(r); },
  ingAdd: () => { $('#ings').insertAdjacentHTML('beforeend', ingRow()); $('#ings .ing:last-child .in-name').focus(); },
  ingDel: el => el.closest('.ing').remove(),
  recipeDel: el => {
    if (!confirm('Delete this recipe?')) return;
    const id = el.dataset.id;
    if (recipe(id)?.photo) store.remove(`photos/${id}`);
    closeSheet(); updateDiet({ recipes: { [id]: OP.del } });
  },
  photoRemove: el => {
    const f = el.closest('form');
    f.dataset.photo = 'remove'; f.elements.photo.value = '';
    $('.photo-row .pic img', f)?.remove(); el.remove();
  },
  viewSuggested: el => {
    const r = SUGGESTED_RECIPES.find(s => s.id === el.dataset.id);
    if (!r) return;
    openSheet(`
      <div class="sheet-head"><div><p class="eyebrow">Suggested · ${isMain(r) ? 'Lunch & dinner' : 'Breakfast'}${r.leftovers ? ' · Leftovers' : ''}</p><h2>${esc(r.name)}</h2></div><button class="link" data-act="closeSheet">Close</button></div>
      ${pic(r, 'hero sheet-hero', 'card')}${ingList(r)}
      <p class="muted small">Quantities for two people. You can edit them after adding.</p>
      <button class="btn primary" data-act="addSuggested" data-id="${esc(r.id)}">Add to my recipes</button>`);
  },
  addSuggested: el => {
    const r = SUGGESTED_RECIPES.find(s => s.id === el.dataset.id);
    closeSheet();
    if (r && !recipe(r.id)) updateDiet({ recipes: { [r.id]: { ...clone(r), o: Date.now() } } });
  },
  addAllSuggested: () => {
    const now = Date.now(), list = suggestions();
    if (list.length) updateDiet({ recipes: Object.fromEntries(list.map((r, i) => [r.id, { ...clone(r), o: now + i }])) });
  },

  check: el => {
    if (S.week === undefined) return;
    const k = el.dataset.key;
    updateWeek({ checked: (S.week?.checked || []).includes(k) ? OP.remove([k]) : OP.union([k]) });
  },
  extraDel: el => {
    const x = (S.week?.extra || []).find(x => x.id === el.dataset.id);
    if (x) updateWeek({ extra: OP.remove([x]), checked: OP.remove(['x|' + x.id]) });
  },
  shopUnits: el => { const p = clone(S.profile); p.shopUnits = el.dataset.u; saveProfile(p); render(true); },
  copyList: async el => {
    const w = S.week || {}, checked = w.checked || [];
    const lines = [
      ...shoppingItems(w.plan, S.diet.recipes, shopSystem()).filter(i => !checked.includes(i.key)).map(i => `${i.name} — ${num(i.qty)} ${i.unit}`.trim()),
      ...(w.extra || []).filter(x => !checked.includes('x|' + x.id)).map(x => x.name),
    ];
    try { await navigator.clipboard.writeText(lines.join('\n')); el.textContent = 'Copied'; } catch { el.textContent = 'Could not copy'; }
  },

  unit: el => { const p = clone(S.profile); p.unit = el.dataset.u; saveProfile(p); render(true); },
  mealsPerWeek: el => updateDiet({ mealsPerWeek: Math.min(14, Math.max(1, target() + +el.dataset.n)) }),
  editProgram: () => { S.editProgram = true; S.progDay = S.gymDay; render(true); $('main').scrollTop = 0; },
  closeProgram: () => { S.editProgram = false; render(true); },
  progDay: el => { S.progDay = +el.dataset.i; render(true); },
  resetProgram: () => {
    if (!confirm('Replace your workout plan with the default one? Logged sets are kept.')) return;
    const p = clone(S.profile); p.program = clone(DEFAULT_PROGRAM); saveProfile(p); render(true);
  },
  exAdd: () => { const p = clone(S.profile); p.program[S.progDay].exercises.push({ id: rid(), name: '', sets: 3, reps: '10', note: '' }); saveProfile(p); render(true); },
  exDel: el => {
    if (!confirm('Remove this exercise from the plan? Its logged sets are kept.')) return;
    const p = clone(S.profile); p.program[S.progDay].exercises.splice(+el.dataset.i, 1); saveProfile(p); render(true);
  },
  exMove: el => {
    const i = +el.dataset.i, p = clone(S.profile), list = p.program[S.progDay].exercises;
    if (i < 1 || i >= list.length) return;
    [list[i - 1], list[i]] = [list[i], list[i - 1]]; saveProfile(p); render(true);
  },
};

// Field handlers run on every keystroke, so nothing typed is lost if the screen changes before the field is left.
const C = {
  set: el => {
    const u = unit(), t = today(), logs = clone(S.logs);
    const list = logs[el.dataset.ex] = logs[el.dataset.ex] || [];
    let cur = list.find(e => e.d === t);
    if (!cur) { cur = { d: t, u, sets: [] }; list.push(cur); list.sort((a, b) => a.d.localeCompare(b.d)); }
    if (cur.u !== u) { cur.sets.forEach(s => { s.w = convWeight(s.w, cur.u, u); }); cur.u = u; }
    const i = +el.dataset.i, f = el.dataset.f;
    while (cur.sets.length <= i) cur.sets.push({ w: null, r: null });
    const v = parseNum(el.value);
    cur.sets[i][f] = v == null ? null : f === 'r' ? Math.round(v) : v;
    // reps typed with the weight left blank: keep the weight suggested from last time
    if (f === 'r' && cur.sets[i].r && cur.sets[i].w == null) {
      const wEl = el.closest('.set')?.querySelector('input[data-f="w"]');
      const w = wEl && wEl.value === '' ? parseNum(wEl.placeholder) : null;
      if (w != null) cur.sets[i].w = w;
    }
    while (cur.sets.length && cur.sets[cur.sets.length - 1].w == null && cur.sets[cur.sets.length - 1].r == null) cur.sets.pop();
    if (!cur.sets.length) list.splice(list.indexOf(cur), 1);
    if (!list.length) delete logs[el.dataset.ex];
    saveLogs(logs);
    dirty = true;
  },
  progEx: el => { S.progEx = el.value; render(true); },
  itemDraft: el => { S.itemDraft = el.value; },
  // show the chosen photo right away; it is saved with the recipe
  photoPick: async el => {
    const f = el.closest('form'), file = el.files?.[0];
    if (!file || f.dataset.busy === file.name + file.size) return;
    f.dataset.busy = file.name + file.size;
    try {
      const data = await resizeImage(file);
      f.dataset.photo = data;
      const tile = $('.photo-row .pic', f);
      tile.querySelector('img')?.remove();
      tile.insertAdjacentHTML('beforeend', `<img src="${data}" alt="">`);
      $('#recipeErr').textContent = '';
    } catch { $('#recipeErr').textContent = 'That file is not a picture.'; }
  },
  name: el => { const p = clone(S.profile); p.name = el.value.trim() || S.user.name; saveProfile(p); dirty = true; },
  dayTitle: el => { const p = clone(S.profile); p.program[S.progDay].title = el.value.trim(); saveProfile(p); dirty = true; },
  prog: el => {
    const p = clone(S.profile), e = p.program[S.progDay].exercises[+el.dataset.i], f = el.dataset.f;
    if (!e) return;
    e[f] = f === 'sets' ? Math.min(12, Math.max(1, parseInt(el.value) || 1)) : el.value.trim();
    saveProfile(p); dirty = true;
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (el && !el.disabled) A[el.dataset.act]?.(el);
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('div[data-act]')) { e.preventDefault(); e.target.click(); }
  // the keyboard's return key must not save a half-edited recipe
  if (e.key === 'Enter' && e.target.matches?.('#recipeForm input')) e.preventDefault();
});
const onField = e => {
  const el = e.target.closest?.('[data-chg]');
  if (el) C[el.dataset.chg]?.(el);
};
document.addEventListener('input', onField);
document.addEventListener('change', onField);
document.addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === 'loginForm') {
    const btn = $('button', f);
    btn.disabled = true;
    try { await store.signIn(f.email.value.trim(), f.password.value); }
    catch (err) {
      const el = $('#loginErr');
      if (el) el.textContent = /network/i.test(err?.code || '') ? 'No connection. Try again.'
        : /too-many/i.test(err?.code || '') ? 'Too many attempts. Try again later.' : 'Wrong email or password.';
      btn.disabled = false;
    }
  }
  if (f.id === 'addItem') {
    const name = f.item.value.trim();
    if (!name || S.week === undefined) return;
    S.itemDraft = '';
    updateWeek({ extra: OP.union([{ id: rid(), name }]) });
    $('#addItem input')?.focus();
  }
  if (f.id === 'recipeForm') {
    const ingredients = [...f.querySelectorAll('.ing')].map(row => ({
      name: $('.in-name', row).value.trim(),
      qty: parseNum($('.in-qty', row).value),
      unit: $('.in-unit', row).value,
    })).filter(i => i.name || i.qty != null);
    const name = f.elements.name.value.trim();
    const err = !name ? 'Give the recipe a name.'
      : !ingredients.length ? 'Add at least one ingredient.'
      : ingredients.some(i => !i.name) ? 'Every ingredient needs a name.'
      : ingredients.some(i => !(i.qty > 0)) ? 'Every ingredient needs a quantity.' : '';
    if (err) { $('#recipeErr').textContent = err; return; }
    const type = f.elements.type.value, id = f.dataset.id || rid();
    const old = recipe(id), pick = f.dataset.photo || '';
    let photo = !!old?.photo;
    if (pick === 'remove') { if (photo) store.remove(`photos/${id}`); photo = false; delete S.photos[id]; }
    else if (pick) { store.save(`photos/${id}`, { data: pick }); S.photos[id] = pick; photo = true; }
    const rec = { id, name, type, ingredients, steps: f.elements.steps.value.trim(), leftovers: type === 'main' && f.elements.leftovers.checked, o: old?.o ?? Date.now(), photo };
    closeSheet(); updateDiet({ recipes: { [id]: rec } });
  }
});

// ---------- start ----------
(async () => {
  try {
    store = await initStore();
  } catch (err) {
    console.error(err);
    $('#app').innerHTML = '<div class="loading">Could not start. Check your connection and reopen the app.</div>';
    return;
  }
  store.onAuth(user => {
    unsubscribe();
    S.user = user;
    if (user) subscribe();
    render(true);
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
