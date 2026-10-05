// Pure logic, no DOM: dates, weights, week plan, shopping list. Covered by tests.html.

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const MEALS = { b: 'Breakfast', l: 'Lunch', d: 'Dinner' };
export const UNITS = ['', 'g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'slices', 'cloves', 'can', 'packet', 'head', 'bunch', 'stalks', 'ears'];

export const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const dow = (d = new Date()) => (d.getDay() + 6) % 7; // 0 = Monday
export const num = n => String(Math.round((Number(n) || 0) * 100) / 100);

// Friday to Sunday you plan the week that starts next Monday; before that, the current one.
export function planningWeek(now = new Date()) {
  const m = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow(now));
  if (dow(now) >= 4) m.setDate(m.getDate() + 7);
  return iso(m);
}
// the Monday (iso) of the week a date (iso) belongs to
export function weekOf(day) { const d = fromIso(day); d.setDate(d.getDate() - dow(d)); return iso(d); }
export function shiftDay(day, n) { const d = fromIso(day); d.setDate(d.getDate() + n); return iso(d); }
export function shiftWeek(id, n) { const d = fromIso(id); d.setDate(d.getDate() + 7 * n); return iso(d); }

export const convWeight = (w, from, to) =>
  w == null || from === to ? w : Math.round((from === 'kg' ? w * 2.20462 : w / 2.20462) * 2) / 2;

// One logged session of one exercise → the numbers the charts use. Sets without reps don't count.
export function entryStats(e, to) {
  const sets = (e.sets || []).filter(s => s && s.r > 0);
  const ws = sets.map(s => convWeight(s.w || 0, e.u, to));
  return {
    sets,
    top: ws.length ? Math.max(...ws) : 0,
    reps: sets.reduce((a, s) => a + s.r, 0),
    vol: sets.reduce((a, s, i) => a + ws[i] * s.r, 0),
  };
}

// ---- partial document updates ----
// Shared documents are never rewritten whole: a change is a patch of the fields it touches, so two
// phones editing at the same time (or one that was offline) cannot wipe each other's changes.
// Values can be OP.union([...]) / OP.remove([...]) for arrays and OP.del to delete a field;
// plain objects merge field by field, everything else (arrays included) replaces the field.
export const OP = {
  union: v => ({ __op: 'union', v }),
  remove: v => ({ __op: 'remove', v }),
  del: { __op: 'del' },
};
const isMap = v => v && typeof v === 'object' && !Array.isArray(v);
const canon = x => isMap(x) ? JSON.stringify(Object.keys(x).sort().map(k => [k, x[k]])) : JSON.stringify(x);
export function applyPatch(doc, patch) {
  const out = { ...(isMap(doc) ? doc : {}) };
  for (const [k, v] of Object.entries(patch)) {
    const cur = Array.isArray(out[k]) ? out[k] : [];
    if (v && v.__op === 'del') delete out[k];
    else if (v && v.__op === 'union') out[k] = [...cur, ...v.v.filter((x, i) => !cur.some(y => canon(y) === canon(x)) && v.v.findIndex(y => canon(y) === canon(x)) === i)];
    else if (v && v.__op === 'remove') out[k] = cur.filter(y => !v.v.some(x => canon(x) === canon(y)));
    else if (isMap(v)) out[k] = applyPatch(out[k], v);
    else out[k] = v;
  }
  return out;
}

export const isMain = r => r.type !== 'breakfast';

// A meal eaten away from home: it sits in the week plan like a recipe, but nothing is bought or cooked for it.
export const OUT = '@out';
export const blankPlan = () => Array.from({ length: 7 }, () => ({ b: null, l: null, d: null, left: {} }));
export const outCount = plan => (plan || []).reduce((n, day) => n + (day?.l === OUT) + (day?.d === OUT), 0);
// lunches and dinners still to cover with picked dishes: the weekly number, less the ones eaten out
export const needed = (perWeek, plan) => Math.max(0, Math.min(perWeek, 14 - outCount(plan)));

function likedMains(liked, recipes) {
  const byId = new Map(recipes.map(r => [r.id, r]));
  return [...new Set(liked || [])].filter(id => byId.has(id) && isMain(byId.get(id))).map(id => byId.get(id));
}

// How many lunch/dinner slots the picked dishes fill: a dish that makes leftovers fills two.
export function coverage(liked, recipes) {
  return likedMains(liked, recipes).reduce((n, r) => n + (r.leftovers ? 2 : 1), 0);
}

// 7 days of { b, l, d, left }. A leftovers dish goes to a dinner and to the next day's lunch
// (left.l = true); the others take the remaining slots once each; if slots are still empty
// the picked dishes repeat, never on the same or on a neighbouring day when that can be avoided.
// Meals marked "eating out" in `keep` (an earlier plan) stay where they are and nothing is cooked for them.
export function buildPlan(liked, recipes, keep) {
  const mains = likedMains(liked, recipes);
  const bfs = recipes.filter(r => r.type === 'breakfast').map(r => r.id);
  const out = (d, m) => keep?.[d]?.[m] === OUT ? OUT : null;
  const plan = Array.from({ length: 7 }, (_, d) => ({ b: out(d, 'b') ?? (bfs.length ? bfs[d % bfs.length] : null), l: out(d, 'l'), d: out(d, 'd'), left: {} }));
  const count = {};
  const put = (d, m, id, left) => { plan[d][m] = id; if (left) plan[d].left[m] = true; count[id] = (count[id] || 0) + 1; };

  const singles = [];
  for (const r of mains) {
    const d = r.leftovers ? [0, 2, 4, 1, 3, 5].find(d => !plan[d].d && !plan[d + 1].l) : undefined;
    if (d === undefined) singles.push(r.id);
    else { put(d, 'd', r.id); put(d + 1, 'l', r.id, true); }
  }

  const ids = mains.map(r => r.id);
  const least = arr => arr.length ? arr.reduce((a, b) => (count[b] || 0) < (count[a] || 0) ? b : a) : undefined;
  for (let d = 0; d < 7; d++) for (const m of ['l', 'd']) {
    if (plan[d][m]) continue;
    const on = (x, id) => plan[x] && (plan[x].l === id || plan[x].d === id);
    const near = id => on(d - 1, id) || on(d, id) || on(d + 1, id);
    const id = singles.find(id => !count[id])
      ?? least(ids.filter(id => !near(id))) ?? least(ids.filter(id => !on(d, id))) ?? least(ids);
    if (id) put(d, m, id);
  }
  return plan;
}

const WEIGHT = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const VOLUME = { ml: 1, l: 1000 };
const r1 = n => Math.round(n * 10) / 10;
const r2 = n => Math.round(n * 100) / 100;

function shown(dim, qty, system) {
  if (dim === 'weight') {
    if (system === 'us') { const oz = qty / WEIGHT.oz; return oz >= 16 ? [r1(oz / 16), 'lb'] : [r1(oz), 'oz']; }
    return qty >= 1000 ? [r2(qty / 1000), 'kg'] : [Math.round(qty), 'g'];
  }
  if (dim === 'volume') return qty >= 1000 ? [r2(qty / 1000), 'l'] : [Math.round(qty), 'ml'];
  return [r2(qty), dim];
}

// Every meal in the plan adds its recipe once (a leftover meal too: you cook double).
// Weights are summed across g/kg/oz/lb and shown in the chosen system ('metric' | 'us').
export function shoppingItems(plan, recipes, system = 'metric') {
  const byId = new Map(recipes.map(r => [r.id, r]));
  const m = new Map();
  for (const day of plan || []) for (const k of Object.keys(MEALS)) {
    const r = byId.get(day[k]);
    if (!r) continue;
    for (const ing of r.ingredients || []) {
      const name = String(ing.name || '').trim();
      if (!name) continue;
      const u = String(ing.unit || '').trim().toLowerCase();
      const q = Number(ing.qty) > 0 ? Number(ing.qty) : 0;
      const [dim, qty] = u in WEIGHT ? ['weight', q * WEIGHT[u]] : u in VOLUME ? ['volume', q * VOLUME[u]] : [u, q];
      const key = name.toLowerCase() + '|' + dim;
      const it = m.get(key) || { key, name, dim, base: 0 };
      it.base += qty;
      m.set(key, it);
    }
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name) || a.dim.localeCompare(b.dim)).map(it => {
    const [qty, unit] = shown(it.dim, it.base, system);
    return { key: it.key, name: it.name, qty, unit };
  });
}
