// Calories and macros estimated from a recipe's ingredients. No network, no AI: a table of common foods.
// Values are per 100 g of the food as bought (raw, dry, drained): [kcal, protein g, carbs g, fat g].
// Optional weights in grams turn "2 eggs" or "1 can" into grams: pc (one piece), slice, clove, can, head,
// bunch, stalk, ear, packet, tbsp, cup.
const F = {
  // dairy and eggs
  'greek yogurt': [73, 10, 4, 2, { cup: 245 }], 'yogurt': [63, 5, 7, 1.6, { cup: 245 }], 'milk': [50, 3.4, 4.8, 2, { cup: 245 }],
  'eggs': [143, 12.6, 0.7, 9.5, { pc: 50 }], 'butter': [717, 0.9, 0.1, 81, { tbsp: 14 }], 'heavy cream': [340, 2.8, 2.8, 36],
  'cream cheese': [342, 6, 4, 34, { tbsp: 15 }], 'parmigiano': [392, 33, 3, 28, { tbsp: 5 }], 'pecorino': [387, 32, 3.6, 27, { tbsp: 5 }],
  'mozzarella': [260, 19, 2, 20, { pc: 125 }], 'feta': [264, 14, 4, 21], 'cheese': [380, 24, 2, 31, { slice: 20, pc: 20 }], 'ricotta': [150, 11, 3, 10],
  // meat and fish
  'chicken breast': [120, 22.5, 0, 2.6, { pc: 200 }], 'chicken thighs': [165, 14, 0, 12, { pc: 150 }], 'whole chicken': [140, 12, 0, 10, { pc: 1400 }],
  'chicken': [120, 22.5, 0, 2.6], 'ground turkey': [150, 19.5, 0, 8], 'turkey': [110, 22, 0, 2], 'turkey or ham': [110, 18, 2, 3, { slice: 20 }],
  'ham': [110, 18, 2, 3, { slice: 20 }], 'prosciutto': [250, 26, 0.5, 16, { slice: 15 }], 'guanciale or pancetta': [500, 15, 0, 49],
  'pancetta': [460, 15, 0, 45], 'guanciale': [600, 9, 0, 63], 'bacon': [420, 13, 1, 40, { slice: 25 }], 'sausage': [300, 14, 2, 26, { pc: 100 }],
  'ground beef': [200, 19.5, 0, 13], 'beef strips': [160, 22, 0, 8], 'beef sirloin': [160, 22, 0, 8], 'steak': [190, 21, 0, 11], 'beef': [180, 21, 0, 10],
  'pork': [180, 21, 0, 10], 'salmon fillet': [206, 20, 0, 13], 'salmon': [206, 20, 0, 13], 'smoked salmon': [117, 18, 0, 4.3],
  'white fish fillets': [82, 18, 0, 0.7], 'cod fillets': [82, 18, 0, 0.7], 'cod': [82, 18, 0, 0.7], 'fish': [90, 19, 0, 1.5],
  'shrimp': [85, 20, 0.2, 0.5], 'canned tuna': [116, 26, 0, 1, { can: 120, pc: 120 }], 'sushi-grade tuna': [130, 28, 0, 1.3], 'tuna': [130, 28, 0, 1.3],
  'sushi trays': [150, 6, 25, 2.5, { pc: 300 }], 'tofu': [120, 13, 2, 7],
  // grains, bread, pasta
  'pasta': [371, 13, 75, 1.5], 'small pasta': [371, 13, 75, 1.5], 'egg noodles': [384, 14, 71, 4.4], 'noodles': [370, 12, 74, 2],
  'rice': [360, 7, 79, 0.6, { cup: 190 }], 'arborio rice': [360, 7, 79, 0.6, { cup: 190 }], 'quinoa': [368, 14, 64, 6, { cup: 170 }], 'couscous': [376, 13, 77, 0.6, { cup: 170 }],
  'rolled oats': [379, 13, 67, 7, { cup: 90 }], 'oats': [379, 13, 67, 7, { cup: 90 }], 'granola': [470, 10, 64, 20, { cup: 110 }],
  'bread': [265, 9, 49, 3.2, { slice: 30, pc: 30 }], 'ciabatta': [270, 9, 52, 3, { pc: 120 }], 'burger buns': [270, 9, 49, 4, { pc: 55 }],
  'bagels': [260, 10, 51, 1.6, { pc: 100 }], 'tortillas': [310, 8, 50, 8, { pc: 45 }], 'breadcrumbs': [395, 13, 72, 5, { tbsp: 7, cup: 110 }],
  'pizza dough': [250, 8, 49, 2], 'pie crust': [480, 6, 50, 29, { pc: 200 }], 'flour': [364, 10, 76, 1, { cup: 125, tbsp: 8 }],
  // legumes, nuts, seeds
  'lentils': [352, 25, 60, 1.1, { cup: 190 }], 'canned beans': [120, 7.5, 20, 1.5, { can: 240, pc: 240 }], 'canned beans or chickpeas': [120, 7.5, 20, 1.5, { can: 240, pc: 240 }],
  'chickpeas': [120, 7.5, 20, 1.5, { can: 240 }], 'beans': [120, 7.5, 20, 1.5, { can: 240 }], 'edamame': [121, 12, 9, 5],
  'chia seeds': [486, 17, 42, 31, { tbsp: 12 }], 'almonds': [579, 21, 22, 50], 'nuts': [600, 18, 20, 52], 'peanut butter': [588, 25, 20, 50, { tbsp: 16 }],
  // vegetables
  'potatoes': [77, 2, 17, 0.1, { pc: 170 }], 'sweet potatoes': [86, 1.6, 20, 0.1, { pc: 200 }], 'parsnips': [75, 1.2, 18, 0.3, { pc: 120 }],
  'onion': [40, 1.1, 9, 0.1, { pc: 110 }], 'garlic': [149, 6.4, 33, 0.5, { clove: 3, pc: 3 }], 'carrots': [41, 0.9, 10, 0.2, { pc: 60 }],
  'celery': [16, 0.7, 3, 0.2, { stalk: 40, pc: 40 }], 'zucchini': [17, 1.2, 3.1, 0.3, { pc: 200 }], 'eggplant': [25, 1, 6, 0.2, { pc: 300 }],
  'bell peppers': [26, 1, 6, 0.3, { pc: 150 }], 'tomatoes': [18, 0.9, 3.9, 0.2, { pc: 120 }], 'cherry tomatoes': [18, 0.9, 3.9, 0.2, { pc: 15 }],
  'tomato passata': [30, 1.5, 5.5, 0.2, { cup: 245, can: 400 }], 'cucumber': [15, 0.7, 3.6, 0.1, { pc: 250 }], 'broccoli': [34, 2.8, 7, 0.4, { head: 350, pc: 350 }],
  'asparagus': [20, 2.2, 3.9, 0.1, { bunch: 250 }], 'spinach': [23, 2.9, 3.6, 0.4, { bunch: 250 }], 'green beans': [31, 1.8, 7, 0.2],
  'mushrooms': [22, 3.1, 3.3, 0.3], 'corn': [86, 3.2, 19, 1.2, { ear: 100, pc: 100, can: 250 }], 'red cabbage': [31, 1.4, 7, 0.2, { head: 900 }],
  'lettuce': [15, 1.4, 2.9, 0.2, { head: 300, pc: 300 }], 'romaine lettuce': [17, 1.2, 3.3, 0.3, { head: 350, pc: 350 }], 'mixed salad': [17, 1.3, 3, 0.2],
  'arugula': [25, 2.6, 3.7, 0.7], 'stir fry vegetables': [40, 2.5, 7, 0.3], 'mixed vegetables': [45, 2.5, 8, 0.4], 'basil': [23, 3, 2.7, 0.6, { bunch: 25 }],
  'olives': [145, 1, 4, 15],
  // fruit
  'banana': [89, 1.1, 23, 0.3, { pc: 120 }], 'berries': [50, 0.8, 12, 0.4, { cup: 150 }], 'frozen berries': [50, 0.8, 12, 0.4, { cup: 150 }],
  'avocado': [160, 2, 9, 15, { pc: 150 }], 'lemon': [29, 1.1, 9, 0.3, { pc: 60 }], 'lime': [30, 0.7, 10, 0.2, { pc: 45 }], 'apple': [52, 0.3, 14, 0.2, { pc: 180 }],
  // sauces, oils, pantry
  'olive oil': [884, 0, 0, 100, { tbsp: 13.5 }], 'oil': [884, 0, 0, 100, { tbsp: 13.5 }], 'pesto': [460, 5, 6, 46, { tbsp: 15 }],
  'caesar dressing': [480, 2, 3, 52, { tbsp: 15 }], 'soy sauce': [53, 8, 5, 0, { tbsp: 16 }], 'honey': [304, 0.3, 82, 0, { tbsp: 21 }],
  'sugar': [387, 0, 100, 0, { tbsp: 12.5 }], 'coconut milk': [190, 2, 3, 19, { can: 400, pc: 400 }], 'curry paste': [120, 3, 12, 6, { tbsp: 15 }],
  'fajita seasoning': [300, 8, 60, 4, { packet: 30, pc: 30 }], 'chili seasoning': [300, 10, 50, 8, { packet: 30, pc: 30 }],
  'vegetable stock': [5, 0.3, 0.6, 0.1], 'chicken stock': [5, 0.5, 0.4, 0.1], 'mayonnaise': [680, 1, 1, 75, { tbsp: 14 }],
};
// other spellings → the table's name
const ALIAS = {
  egg: 'eggs', potato: 'potatoes', 'sweet potato': 'sweet potatoes', tomato: 'tomatoes', carrot: 'carrots', 'bell pepper': 'bell peppers',
  peppers: 'bell peppers', pepper: 'bell peppers', onions: 'onion', tortilla: 'tortillas', bagel: 'bagels', 'burger bun': 'burger buns', buns: 'burger buns',
  parmesan: 'parmigiano', 'parmigiano reggiano': 'parmigiano', passata: 'tomato passata', 'tomato sauce': 'tomato passata', oatmeal: 'rolled oats',
  'chicken thigh': 'chicken thighs', 'chicken breasts': 'chicken breast', prawns: 'shrimp', shrimps: 'shrimp', courgette: 'zucchini', aubergine: 'eggplant',
  rocket: 'arugula', salad: 'mixed salad', 'green salad': 'mixed salad', mushroom: 'mushrooms', lentil: 'lentils', bananas: 'banana', avocados: 'avocado',
  lemons: 'lemon', limes: 'lime', 'cod fillet': 'cod fillets', 'white fish': 'white fish fillets', 'ground turkey meat': 'ground turkey', mince: 'ground beef',
  'minced beef': 'ground beef', cream: 'heavy cream', 'whole milk': 'milk', 'skim milk': 'milk', 'canned chickpeas': 'chickpeas', 'black beans': 'beans',
  'kidney beans': 'beans', 'cannellini beans': 'beans', 'evoo': 'olive oil', 'extra virgin olive oil': 'olive oil', sushi: 'sushi trays',
};

const WEIGHT = { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 };
const clean = s => String(s || '').toLowerCase().replace(/[^a-z\s-]/g, ' ').replace(/\s+/g, ' ').trim();
const KEYS = Object.keys(F).sort((a, b) => b.length - a.length);

// The table entry for an ingredient name: exact, a known other spelling, or the longest food named inside it
// ("grilled chicken breast" → chicken breast). undefined when the food is not in the table.
export function food(name) {
  const n = clean(name);
  if (!n) return undefined;
  const direct = F[n] || F[ALIAS[n]] || F[n + 's'] || F[n.replace(/s$/, '')];
  if (direct) return direct;
  const key = KEYS.find(k => new RegExp(`(^| )${k}( |$)`).test(n)) || Object.keys(ALIAS).sort((a, b) => b.length - a.length).find(k => new RegExp(`(^| )${k}( |$)`).test(n));
  return key ? F[key] || F[ALIAS[key]] : undefined;
}

// grams of an ingredient line, or null when its unit cannot be turned into a weight for that food
export function grams(ing, entry) {
  const q = Number(ing.qty) > 0 ? Number(ing.qty) : 0;
  const u = String(ing.unit || '').trim().toLowerCase();
  const w = entry?.[4] || {};
  if (u in WEIGHT) return q * WEIGHT[u];
  if (u === 'ml') return q;
  if (u === 'l') return q * 1000;
  const tbsp = w.tbsp ?? 15;
  const per = { tbsp, tsp: tbsp / 3, cup: w.cup ?? 240, slices: w.slice ?? w.pc, cloves: w.clove ?? w.pc, can: w.can, packet: w.packet,
    head: w.head ?? w.pc, bunch: w.bunch, stalks: w.stalk ?? w.pc, ears: w.ear ?? w.pc, '': w.pc }[u];
  return per ? q * per : null;
}

// Estimate for ONE person of a recipe written for `servings` people. `missing` lists what could not be counted.
export function estimate(recipe, servings = 2) {
  const t = [0, 0, 0, 0], missing = [];
  for (const ing of recipe?.ingredients || []) {
    const e = food(ing.name), g = e ? grams(ing, e) : null;
    if (g == null) { if (String(ing.name || '').trim()) missing.push(String(ing.name).trim()); continue; }
    for (let i = 0; i < 4; i++) t[i] += e[i] * g / 100;
  }
  const [kcal, p, c, f] = t.map(x => Math.round(x / servings));
  return { kcal, p, c, f, missing, complete: !missing.length };
}

// What the app shows for a recipe: the numbers typed in the recipe if any, otherwise the estimate.
export function nutrition(recipe) {
  if (!recipe) return null;
  if (Number(recipe.kcal) > 0) {
    return { kcal: Math.round(recipe.kcal), p: Math.round(recipe.p || 0), c: Math.round(recipe.c || 0), f: Math.round(recipe.f || 0), manual: true, complete: true, missing: [] };
  }
  return { ...estimate(recipe), manual: false };
}

// One day of the food diary → what was eaten and what is left.
//   day = { m: { b|l|d: { kcal, p, c, f } }, x: [{ kcal }], burned }
export function dayTotals(day, target = 0) {
  const eaten = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const m of Object.values(day?.m || {})) if (m) for (const k of Object.keys(eaten)) eaten[k] += Number(m[k]) || 0;
  for (const x of day?.x || []) eaten.kcal += Number(x.kcal) || 0;
  const burned = Number(day?.burned) > 0 ? Number(day.burned) : 0;
  return { ...eaten, burned, target, left: Math.round(target + burned - eaten.kcal), any: eaten.kcal > 0 || burned > 0 };
}
