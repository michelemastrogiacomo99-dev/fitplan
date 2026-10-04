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

// Ideas offered in Meals → Recipes → Suggested. They join the recipes only when added from there.
export const SUGGESTED_RECIPES = [
  r('s-caesar', 'Chicken Caesar Salad', 'main', [['Chicken breast', 350, 'g'], ['Romaine lettuce', 1, 'head'], ['Parmigiano', 40, 'g'], ['Bread', 2, 'slices'], ['Caesar dressing', 4, 'tbsp']]),
  r('s-meatballs', 'Turkey Meatballs in Tomato Sauce', 'main', [['Ground turkey', 450, 'g'], ['Tomato passata', 400, 'g'], ['Eggs', 1, ''], ['Breadcrumbs', 40, 'g'], ['Rice', 160, 'g'], ['Parmigiano', 30, 'g']], true),
  r('s-shrimp-tacos', 'Shrimp Tacos', 'main', [['Shrimp', 350, 'g'], ['Tortillas', 6, ''], ['Avocado', 1, ''], ['Red cabbage', 150, 'g'], ['Lime', 1, ''], ['Greek yogurt', 80, 'g']]),
  r('s-greek-bowl', 'Greek Chicken Bowl', 'main', [['Chicken breast', 400, 'g'], ['Rice', 160, 'g'], ['Cucumber', 1, ''], ['Cherry tomatoes', 200, 'g'], ['Feta', 100, 'g'], ['Greek yogurt', 100, 'g']]),
  r('s-pesto-chicken', 'Pesto Pasta with Chicken', 'main', [['Pasta', 200, 'g'], ['Chicken breast', 300, 'g'], ['Pesto', 80, 'g'], ['Cherry tomatoes', 150, 'g'], ['Parmigiano', 30, 'g']], true),
  r('s-caprese', 'Caprese with Prosciutto', 'main', [['Mozzarella', 250, 'g'], ['Tomatoes', 3, ''], ['Prosciutto', 100, 'g'], ['Basil', 1, 'bunch'], ['Ciabatta', 1, '']]),
  r('s-tuna-wrap', 'Tuna Wraps', 'main', [['Tortillas', 4, ''], ['Canned tuna', 2, 'can'], ['Lettuce', 1, 'head'], ['Tomatoes', 2, ''], ['Greek yogurt', 60, 'g']]),
  r('s-minestrone', 'Minestrone', 'main', [['Mixed vegetables', 600, 'g'], ['Canned beans', 1, 'can'], ['Small pasta', 100, 'g'], ['Tomato passata', 200, 'g'], ['Onion', 1, ''], ['Parmigiano', 30, 'g']], true),
  r('s-chicken-curry', 'Chicken Curry with Rice', 'main', [['Chicken breast', 450, 'g'], ['Coconut milk', 1, 'can'], ['Curry paste', 2, 'tbsp'], ['Onion', 1, ''], ['Rice', 180, 'g'], ['Spinach', 100, 'g']], true),
  r('s-chili', 'Beef Chili', 'main', [['Ground beef', 450, 'g'], ['Canned beans', 2, 'can'], ['Tomato passata', 400, 'g'], ['Onion', 1, ''], ['Bell peppers', 1, ''], ['Chili seasoning', 1, 'packet']], true),
  r('s-stuffed-peppers', 'Stuffed Peppers', 'main', [['Bell peppers', 4, ''], ['Ground turkey', 350, 'g'], ['Rice', 100, 'g'], ['Tomato passata', 200, 'g'], ['Mozzarella', 100, 'g']]),
  r('s-parmigiana', 'Eggplant Parmigiana', 'main', [['Eggplant', 2, ''], ['Tomato passata', 500, 'g'], ['Mozzarella', 250, 'g'], ['Parmigiano', 60, 'g'], ['Basil', 1, 'bunch']], true),
  r('s-carbonara', 'Pasta alla Carbonara', 'main', [['Pasta', 200, 'g'], ['Guanciale or pancetta', 120, 'g'], ['Eggs', 3, ''], ['Pecorino', 60, 'g']]),
  r('s-risotto', 'Mushroom Risotto', 'main', [['Arborio rice', 180, 'g'], ['Mushrooms', 300, 'g'], ['Onion', 1, ''], ['Vegetable stock', 800, 'ml'], ['Parmigiano', 40, 'g']]),
  r('s-steak', 'Steak, Roasted Potatoes and Green Beans', 'main', [['Steak', 450, 'g'], ['Potatoes', 500, 'g'], ['Green beans', 250, 'g'], ['Garlic', 2, 'cloves']]),
  r('s-cod', 'Baked Cod with Cherry Tomatoes and Olives', 'main', [['Cod fillets', 400, 'g'], ['Cherry tomatoes', 300, 'g'], ['Olives', 60, 'g'], ['Potatoes', 400, 'g'], ['Garlic', 2, 'cloves']]),
  r('s-turkey-burger', 'Turkey Burgers with Sweet Potato Fries', 'main', [['Ground turkey', 400, 'g'], ['Burger buns', 2, ''], ['Sweet potatoes', 500, 'g'], ['Lettuce', 1, 'head'], ['Tomatoes', 1, '']]),
  r('s-chicken-soup', 'Chicken Noodle Soup', 'main', [['Chicken breast', 300, 'g'], ['Egg noodles', 150, 'g'], ['Carrots', 2, ''], ['Celery', 2, 'stalks'], ['Onion', 1, ''], ['Chicken stock', 1, 'l']], true),
  r('s-lentil-soup', 'Lentil Soup', 'main', [['Lentils', 250, 'g'], ['Carrots', 2, ''], ['Celery', 2, 'stalks'], ['Onion', 1, ''], ['Tomato passata', 200, 'g'], ['Bread', 4, 'slices']], true),
  r('s-pizza', 'Homemade Margherita Pizza', 'main', [['Pizza dough', 500, 'g'], ['Tomato passata', 250, 'g'], ['Mozzarella', 250, 'g'], ['Basil', 1, 'bunch']]),
  r('s-quesadilla', 'Chicken Quesadillas', 'main', [['Tortillas', 4, ''], ['Chicken breast', 300, 'g'], ['Cheese', 150, 'g'], ['Bell peppers', 1, ''], ['Avocado', 1, '']]),
  r('s-poke', 'Tuna Poke Bowl', 'main', [['Sushi-grade tuna', 300, 'g'], ['Rice', 180, 'g'], ['Avocado', 1, ''], ['Cucumber', 1, ''], ['Edamame', 100, 'g'], ['Soy sauce', 3, 'tbsp']]),
  r('sb-scrambled', 'Scrambled Eggs on Toast', 'breakfast', [['Eggs', 5, ''], ['Bread', 4, 'slices'], ['Butter', 15, 'g']]),
  r('sb-pancakes', 'Protein Pancakes with Berries', 'breakfast', [['Rolled oats', 100, 'g'], ['Eggs', 2, ''], ['Banana', 2, ''], ['Greek yogurt', 150, 'g'], ['Berries', 150, 'g']]),
  r('sb-smoothie', 'Smoothie Bowl', 'breakfast', [['Frozen berries', 300, 'g'], ['Banana', 2, ''], ['Greek yogurt', 200, 'g'], ['Granola', 60, 'g']]),
  r('sb-bagel', 'Bagel with Salmon and Cream Cheese', 'breakfast', [['Bagels', 2, ''], ['Smoked salmon', 120, 'g'], ['Cream cheese', 60, 'g']]),
  r('sb-overnight', 'Overnight Oats', 'breakfast', [['Rolled oats', 120, 'g'], ['Milk', 300, 'ml'], ['Greek yogurt', 150, 'g'], ['Chia seeds', 2, 'tbsp'], ['Berries', 150, 'g']]),
];
