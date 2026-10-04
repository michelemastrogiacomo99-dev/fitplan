// Default plan every new account starts from.

const ex = (id, name, sets, reps, note = '') => ({ id, name, sets, reps, note });

// Index 0 = Monday … 6 = Sunday
export const DEFAULT_PROGRAM = [
  { title: 'Quads', exercises: [
    ex('bb-squat', 'BB Squat', 3, '10'),
    ex('single-leg-press', 'Single Leg Press', 3, '10'),
    ex('goblet-squat', 'Heel Elevated Goblet Squat', 3, '10'),
    ex('leg-ext', 'Leg Extensions', 3, '10'),
    ex('calf-raise', 'Calf Raise', 3, '12'),
  ] },
  { title: 'Chest and Tricep', exercises: [
    ex('bench', 'Bench Press', 3, '10'),
    ex('incline-press', 'Incline Chest Press', 3, '10'),
    ex('overhead-ext', 'Overhead Extensions', 3, '10', 'Dumbbell or cable'),
    ex('tri-pushdown', 'Triceps Push Down', 3, '10'),
    ex('machine-fly', 'Machine Flyes', 3, '10'),
    ex('pushups', 'Push Ups', 3, 'max'),
  ] },
  { title: 'Glutes', exercises: [
    ex('hip-thrust', 'Hip Thrusts', 3, '10', '10 hip thrusts into a 10 sec hold into 5 Kas glute bridges'),
    ex('split-squat', 'Brazilian Split Squat', 3, '10'),
    ex('hip-abductor', 'Hip Abductors', 3, '10'),
    ex('glute-leg-press', 'Glute-Focused Leg Press', 3, '10', 'Feet higher and slightly wider on the platform'),
  ] },
  { title: 'Back and Bicep', exercises: [
    ex('bicep-curl', 'Bicep Curls', 3, '10'),
    ex('hammer-curl', 'Hammer Curl', 3, '10'),
    ex('lat-pulldown', 'Lat Pull Down', 3, '10', 'Or high cable row'),
    ex('cable-row', 'Seated Cable Row', 3, '10'),
    ex('pullups', 'Pull Ups', 3, 'max'),
  ] },
  { title: 'Hamstring & Glutes', exercises: [
    ex('rdl', 'Romanian Deadlifts (RDLs)', 3, '10'),
    ex('ham-curl', 'Hamstring Curls', 3, '10'),
    ex('reverse-lunge', 'Reverse Lunges', 3, '10 each leg', 'Take a decent step backwards and lean forward slightly for more glute involvement'),
    ex('hip-adductor', 'Hip Adductor Machine', 3, '10'),
  ] },
  { title: 'Shoulders', exercises: [
    ex('db-ohp', 'DB Overhead Press', 3, '10', '14 lbs'),
    ex('front-raise', 'DB Front Raise', 3, '10', 'Superset'),
    ex('lat-raise', 'W DB Lateral Raises', 3, '10', 'DB or cable · 6 lbs'),
    ex('face-pull', 'Seated Face Pull', 3, '10'),
    ex('rear-delt', 'Rear Delt Flyes', 3, '10'),
  ] },
  { title: 'Rest', exercises: [] },
];

const r = (id, name, type, ingredients, leftovers = false) => ({
  id, name, type, steps: '', leftovers,
  ingredients: ingredients.map(([name, qty, unit]) => ({ name, qty, unit })),
});

// Quantities are for two people (one meal). They are a first proposal: edit them in the app.
export const DEFAULT_RECIPES = [
  r('bf-yogurt', 'Greek Yogurt with Fruit', 'breakfast', [['Greek yogurt', 400, 'g'], ['Berries', 200, 'g'], ['Honey', 2, 'tsp']]),
  r('bf-oats', 'Oats', 'breakfast', [['Rolled oats', 120, 'g'], ['Milk', 400, 'ml'], ['Banana', 2, '']]),
  r('bf-avo', 'Avocado Toast', 'breakfast', [['Bread', 4, 'slices'], ['Avocado', 2, ''], ['Eggs', 2, '']]),
  r('m-sushi', 'Publix Sushi', 'main', [['Sushi trays', 2, '']]),
  r('m-bolognese', 'Bolognese', 'main', [['Pasta', 200, 'g'], ['Ground beef', 400, 'g'], ['Tomato passata', 500, 'g'], ['Onion', 1, ''], ['Carrots', 1, ''], ['Celery', 1, 'stalks'], ['Parmigiano', 30, 'g']], true),
  r('m-baked-bolognese', 'Baked Bolognese', 'main', [['Pasta', 200, 'g'], ['Ground beef', 400, 'g'], ['Tomato passata', 500, 'g'], ['Onion', 1, ''], ['Mozzarella', 200, 'g'], ['Parmigiano', 40, 'g']]),
  r('m-fajitas', 'Chicken Fajitas', 'main', [['Chicken breast', 400, 'g'], ['Tortillas', 6, ''], ['Bell peppers', 2, ''], ['Onion', 1, ''], ['Fajita seasoning', 1, 'packet'], ['Avocado', 1, '']]),
  r('m-ciabatta', 'Ciabatta Sandwiches', 'main', [['Ciabatta', 2, ''], ['Lettuce', 1, 'head'], ['Cheese', 4, 'slices'], ['Turkey or ham', 150, 'g']]),
  r('m-sandwiches', 'Sandwiches', 'main', [['Bread', 4, 'slices'], ['Lettuce', 1, 'head'], ['Cheese', 4, 'slices'], ['Turkey or ham', 150, 'g']]),
  r('m-egg-sandwich', 'Egg Sandwiches', 'main', [['Bread', 4, 'slices'], ['Eggs', 4, ''], ['Cheese', 2, 'slices']]),
  r('m-frittata', 'Frittata', 'main', [['Eggs', 6, ''], ['Zucchini', 1, ''], ['Onion', 1, ''], ['Parmigiano', 30, 'g']]),
  r('m-quiche', 'Quiche', 'main', [['Pie crust', 1, ''], ['Eggs', 3, ''], ['Heavy cream', 200, 'ml'], ['Cheese', 100, 'g'], ['Spinach', 150, 'g']]),
  r('m-fish-broccoli', 'Fish, Potatoes and Broccoli', 'main', [['White fish fillets', 400, 'g'], ['Potatoes', 500, 'g'], ['Broccoli', 300, 'g'], ['Lemon', 1, '']]),
  r('m-fish-sweet', 'Fish, Salad and Sweet Potatoes', 'main', [['White fish fillets', 400, 'g'], ['Sweet potatoes', 500, 'g'], ['Mixed salad', 150, 'g']]),
  r('m-beef-stirfry', 'Beef Stir Fry with Rice or Noodles', 'main', [['Beef strips', 350, 'g'], ['Stir fry vegetables', 400, 'g'], ['Rice', 160, 'g'], ['Soy sauce', 3, 'tbsp']]),
  r('m-salmon-avocado', 'Salmon, Rice and Avocado', 'main', [['Salmon fillet', 350, 'g'], ['Rice', 160, 'g'], ['Avocado', 1, ''], ['Soy sauce', 2, 'tbsp']], true),
  r('m-salmon-broccoli', 'Salmon, Rice and Broccoli', 'main', [['Salmon fillet', 350, 'g'], ['Rice', 160, 'g'], ['Broccoli', 300, 'g'], ['Soy sauce', 2, 'tbsp']]),
  r('m-spinach-pasta', 'Spinach and Asparagus Pasta', 'main', [['Pasta', 200, 'g'], ['Spinach', 200, 'g'], ['Asparagus', 250, 'g'], ['Garlic', 2, 'cloves'], ['Parmigiano', 30, 'g']], true),
  r('m-potato-pasta', 'Potato Pasta', 'main', [['Pasta', 180, 'g'], ['Potatoes', 400, 'g'], ['Onion', 1, ''], ['Parmigiano', 40, 'g']]),
  r('m-legume-pasta', 'Pasta with Legumes', 'main', [['Pasta', 180, 'g'], ['Canned beans or chickpeas', 400, 'g'], ['Tomato passata', 200, 'g'], ['Garlic', 2, 'cloves']], true),
  r('m-chicken-thighs', 'Chicken Thighs, Potatoes, Peppers and Corn', 'main', [['Chicken thighs', 600, 'g'], ['Potatoes', 500, 'g'], ['Bell peppers', 2, ''], ['Corn', 2, 'ears']]),
  r('m-shrimp', 'Shrimp, Potatoes and Asparagus', 'main', [['Shrimp', 400, 'g'], ['Potatoes', 500, 'g'], ['Asparagus', 250, 'g'], ['Garlic', 2, 'cloves']]),
  r('m-roast-chicken', 'Roast Chicken, Potatoes and Parsnips', 'main', [['Whole chicken', 1, ''], ['Potatoes', 600, 'g'], ['Parsnips', 300, 'g']]),
  r('m-ciambotta', 'Ciambotta', 'main', [['Eggplant', 1, ''], ['Zucchini', 2, ''], ['Bell peppers', 2, ''], ['Potatoes', 300, 'g'], ['Tomatoes', 300, 'g'], ['Onion', 1, '']]),
];
