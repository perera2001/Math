// question-service/seed-questions.js
//
// Seeds the Grade 9 question bank from the Word document
// (questions_grade_9.docx). Wipes ALL existing Question documents
// before inserting the new set, so re-running this script is safe.
//
// Total: 268 questions across 9 (lesson × difficulty) buckets:
//   Geometry: Easy 40, Medium 40, Hard 40
//   Algebra : Easy 30, Medium 30, Hard 30
//   Numbers : Easy 17, Medium 21, Hard 20
//
// All questions are created by the Grade 9 year coordinator
// (looked up by email below).

const mongoose = require('mongoose');
const path = require('path');

// Always load the service-level .env, even when running from scripts/.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const questionSchema = new mongoose.Schema({
  lesson: { type: String, enum: ['Geometry', 'Algebra', 'Numbers'], required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  questionText: { type: String, required: true },
  answers: [{
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  grade: { type: String, default: 'GRADE_9' },
}, { timestamps: true });

const Question = mongoose.models.Question || mongoose.model('Question', questionSchema);

// ---------------------------------------------------------------------------
// Question bank
// Each entry: { lesson, difficulty, q, options: [A, B, C, D], correct }
//   correct is the zero-based index of the correct option (0=A, 1=B, 2=C, 3=D)
// ---------------------------------------------------------------------------
const QUESTIONS = [

  // ===== Geometry Easy =====
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Statements accepted without proof are called:', options: ['Theorems', 'Axioms', 'Proofs', 'Rules'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If a = b and b = c, then a = c. This is:', options: ['Axiom 1', 'Axiom 2', 'Axiom 3', 'Axiom 5'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Angles on a straight line add up to:', options: ['90°', '180°', '270°', '360°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Vertically opposite angles are:', options: ['Supplementary', 'Equal', 'Half', 'Random'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If one angle on a straight line is 70°, the other is:', options: ['70°', '90°', '110°', '180°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Two lines that never meet are called:', options: ['Intersecting lines', 'Perpendicular lines', 'Parallel lines', 'Curved lines'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If x = y, then x + 5 = y + 5 is:', options: ['Axiom 1', 'Axiom 2', 'Axiom 4', 'Axiom 5'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'A line crossing two lines is called a:', options: ['Radius', 'Transversal', 'Diameter', 'Axis'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If a vertically opposite angle is 45°, the opposite angle is:', options: ['135°', '90°', '45°', '180°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Complementary angles add up to:', options: ['90°', '180°', '360°', '45°'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'The sum of interior angles of a triangle is:', options: ['90°', '180°', '270°', '360°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If two angles of a triangle are 50° and 60°, the third angle is:', options: ['70°', '80°', '90°', '100°'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'An exterior angle of a triangle equals the sum of:', options: ['All interior angles', 'Two opposite interior angles', 'Adjacent angles', 'Equal angles'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'The sum of exterior angles of any polygon is:', options: ['180°', '270°', '360°', '540°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'A quadrilateral has how many sides?', options: ['3', '4', '5', '6'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Sum of interior angles of a quadrilateral is:', options: ['180°', '360°', '540°', '720°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'A regular pentagon has all sides:', options: ['Different', 'Equal', 'Parallel', 'Curved'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'A triangle has an exterior angle of 110°. The sum of the two opposite interior angles is:', options: ['70°', '90°', '110°', '180°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Sum of interior angles of a pentagon is:', options: ['360°', '540°', '720°', '900°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'A regular hexagon has each exterior angle:', options: ['30°', '45°', '60°', '90°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'The circumference of a circle with radius 7 cm is:', options: ['14 cm', '22 cm', '44 cm', '154 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'The formula for circumference using diameter is:', options: ['πr²', 'πd', '2l + b', 'bh'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Area of a circle with radius 7 cm is:', options: ['44 cm²', '154 cm²', '22 cm²', '49 cm²'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Area of a parallelogram =', options: ['base × height', 'length × width', '½ × base × height', 'side × side'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Area of a trapezium =', options: ['½(a + b)h', 'bh', 'πr²', '2πr'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Circumference of a circle with diameter 10 cm (π = 3.14):', options: ['31.4 cm', '62.8 cm', '15.7 cm', '10 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Area of a parallelogram with base 6 cm and height 5 cm:', options: ['11 cm²', '30 cm²', '60 cm²', '15 cm²'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Area of a circle with diameter 14 cm:', options: ['154 cm²', '44 cm²', '22 cm²', '77 cm²'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'A semicircle curved perimeter is half of:', options: ['Area', 'Radius', 'Full circumference', 'Diameter'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Area of a trapezium with sides 8 cm, 12 cm and height 5 cm:', options: ['40 cm²', '50 cm²', '60 cm²', '70 cm²'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'In a right-angled triangle, the side opposite the 90° angle is called:', options: ['Base', 'Height', 'Hypotenuse', 'Radius'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'The Pythagorean relation is:', options: ['a + b = c', 'a² + b² = c²', 'a² = b + c', '2a = b² + c²'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If the two shorter sides are 3 cm and 4 cm, the hypotenuse is:', options: ['5 cm', '6 cm', '7 cm', '8 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'A triangle with one angle 90° is called:', options: ['Isosceles triangle', 'Right-angled triangle', 'Equilateral triangle', 'Acute triangle'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If sides are 6 cm and 8 cm, hypotenuse =', options: ['9 cm', '10 cm', '12 cm', '14 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If hypotenuse = 13 cm and one side = 5 cm, other side =', options: ['8 cm', '10 cm', '12 cm', '15 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'Which set forms a right triangle?', options: ['2, 3, 4', '3, 4, 5', '4, 5, 6', '5, 6, 7'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'The longest side of a right triangle is always the:', options: ['Adjacent side', 'Base', 'Hypotenuse', 'Height'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If both shorter sides are 1 cm, hypotenuse² =', options: ['1', '2', '3', '4'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Easy', q: 'If c² = 25, then c =', options: ['4', '5', '6', '7'], correct: 1 },

  // ===== Geometry Medium =====
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If one of two adjacent angles on a straight line is 125°, the other is:', options: ['45°', '55°', '65°', '75°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Two lines intersect. One angle is 60°. The adjacent angle is:', options: ['60°', '120°', '30°', '180°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If corresponding angles are equal, the two lines are:', options: ['Perpendicular', 'Parallel', 'Equal', 'Curved'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If a = b and c = d, then a + c = b + d is based on:', options: ['Axiom 1', 'Axiom 2', 'Axiom 3', 'Axiom 4'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If alternate angles are equal, the lines are:', options: ['Intersecting', 'Parallel', 'Same line', 'Perpendicular'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If allied angles are supplementary, lines are:', options: ['Parallel', 'Equal', 'Vertical', 'Bisected'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If x = 8, then 3x = ?', options: ['11', '16', '24', '32'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'One angle is 35°. Its vertically opposite angle is:', options: ['145°', '35°', '55°', '70°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If two angles are complementary and one is 28°, the other is:', options: ['62°', '152°', '72°', '118°'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If a = b, then a ÷ 2 = b ÷ 2 is based on:', options: ['Axiom 2', 'Axiom 3', 'Axiom 5', 'Axiom 1'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Triangle angles are x, 2x, 3x. Find x:', options: ['20°', '30°', '40°', '45°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Two interior opposite angles are 35° and 65°. Exterior angle is:', options: ['90°', '100°', '110°', '120°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Sum of interior angles of a hexagon is:', options: ['540°', '720°', '900°', '1080°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Each exterior angle of a regular octagon is:', options: ['30°', '45°', '60°', '90°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Each interior angle of a regular pentagon is:', options: ['72°', '90°', '108°', '120°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If one angle of a triangle is 90° and another is 35°, third angle is:', options: ['45°', '55°', '65°', '75°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'A polygon has exterior angles summing to:', options: ['Depends on sides', '180°', '360°', '540°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Number of sides of a regular polygon with each exterior angle 72° is:', options: ['4', '5', '6', '8'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Interior angle of a regular hexagon is:', options: ['90°', '108°', '120°', '135°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Sum of interior angles of a heptagon is:', options: ['720°', '900°', '1080°', '1260°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Circumference = 44 cm. Radius is:', options: ['14 cm', '7 cm', '21 cm', '3.5 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Area = 154 cm². Radius is:', options: ['7 cm', '14 cm', '3.5 cm', '21 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Base = 12 cm, area = 96 cm². Height =', options: ['8 cm', '10 cm', '6 cm', '12 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Trapezium area = 72 cm², height = 6 cm, one side = 8 cm. Other side =', options: ['10 cm', '12 cm', '16 cm', '24 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Total perimeter of a semicircle (radius 7 cm) =', options: ['22 cm', '36 cm', '44 cm', '28 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Wheel radius 35 cm turns once. Distance traveled =', options: ['110 cm', '220 cm', '70 cm', '35 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Circle circumference 62.8 cm. Radius =', options: ['5 cm', '10 cm', '15 cm', '20 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Trapezium sides 15 cm, 9 cm, height 7 cm. Area =', options: ['42 cm²', '84 cm²', '56 cm²', '63 cm²'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Area of circle radius 14 cm =', options: ['616 cm²', '308 cm²', '154 cm²', '44 cm²'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If radius doubles, circumference becomes:', options: ['Same', 'Double', 'Triple', 'Half'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If sides are 9 cm and 12 cm, hypotenuse =', options: ['13 cm', '14 cm', '15 cm', '16 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'A ladder 10 m long reaches a wall 8 m high. Distance from wall =', options: ['4 m', '5 m', '6 m', '7 m'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If hypotenuse = 17 cm and one side = 8 cm, other side =', options: ['12 cm', '15 cm', '16 cm', '9 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'A square has side 6 cm. Its diagonal =', options: ['6√2 cm', '12 cm', '3√2 cm', '9 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'One side is 7 cm and hypotenuse is 25 cm, other side =', options: ['24 cm', '18 cm', '20 cm', '22 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Perimeter of a 3-4-5 triangle =', options: ['10 cm', '11 cm', '12 cm', '13 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'A rectangle is 5 cm by 12 cm. Diagonal =', options: ['10 cm', '12 cm', '13 cm', '15 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'If both shorter sides are 5 cm, hypotenuse =', options: ['5√2 cm', '10 cm', '25 cm', '7 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'A pole 15 m high with rope fixed 8 m away. Rope length =', options: ['15 m', '16 m', '17 m', '18 m'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Medium', q: 'Which set is NOT a right triangle?', options: ['5, 12, 13', '8, 15, 17', '6, 8, 10', '6, 7, 10'], correct: 3 },

  // ===== Geometry Hard =====
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Two straight lines intersect. One angle is x, adjacent angle is 3x. Find x.', options: ['30°', '45°', '60°', '90°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If corresponding angles are 2x and 80°, find x.', options: ['20°', '30°', '40°', '80°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If vertically opposite angles are (3x + 10)° and 100°, find x.', options: ['20', '30', '40', '50'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Two allied angles are (x + 20)° and (2x)°. Find x.', options: ['40°', '50°', '60°', '70°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If a = b, b = c, and c = d, then a = d uses:', options: ['Axiom 1 repeatedly', 'Axiom 2', 'Axiom 3', 'Axiom 5'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'One angle on a straight line is (x + 30)°, other is (2x)°. Find x.', options: ['40°', '50°', '60°', '70°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If one angle of intersecting lines is 75°, the smallest angle formed is:', options: ['75°', '105°', '180°', '15°'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If alternate angles are (x + 15)° and 2x°, find x.', options: ['10°', '15°', '20°', '25°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If two supplementary angles are equal, each angle is:', options: ['45°', '60°', '90°', '180°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If x = y and y = 12, then 5x =', options: ['12', '24', '60', '120'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Triangle angles are (x+10)°, (2x)°, (3x−10)°. Find x.', options: ['20°', '30°', '40°', '50°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Exterior angle of a triangle is 125°. One opposite interior angle is 55°. The other is:', options: ['60°', '70°', '75°', '80°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Sum of interior angles of an n-sided polygon is 900°. Find n.', options: ['6', '7', '8', '9'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Each interior angle of a regular polygon is 150°. Number of sides =', options: ['10', '12', '8', '6'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Each exterior angle of a regular polygon is 24°. Number of sides =', options: ['12', '15', '18', '20'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A regular polygon has 9 sides. Each interior angle is:', options: ['120°', '140°', '150°', '160°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'In a triangle, exterior angle is twice one opposite angle and three times the other. Exterior angle is:', options: ['72°', '90°', '108°', '120°'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Interior angle of a regular polygon is 165°. Number of sides =', options: ['18', '20', '24', '30'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Sum of interior angles of two triangles and one quadrilateral is:', options: ['540°', '720°', '900°', '1080°'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A polygon has interior angle sum 1260°. Number of sides =', options: ['7', '8', '9', '10'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Circumference = 44 cm. Radius is:', options: ['14 cm', '7 cm', '21 cm', '3.5 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Area = 154 cm². Radius is:', options: ['7 cm', '14 cm', '3.5 cm', '21 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Base = 12 cm, area = 96 cm². Height =', options: ['8 cm', '10 cm', '6 cm', '12 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Trapezium area = 72 cm², height = 6 cm, one side = 8 cm. Other side =', options: ['10 cm', '12 cm', '16 cm', '24 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Total perimeter of a semicircle (radius 7 cm) =', options: ['22 cm', '36 cm', '44 cm', '28 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Wheel radius 35 cm turns once. Distance traveled =', options: ['110 cm', '220 cm', '70 cm', '35 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Circle circumference 62.8 cm. Radius =', options: ['5 cm', '10 cm', '15 cm', '20 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Trapezium sides 15 cm, 9 cm, height 7 cm. Area =', options: ['42 cm²', '84 cm²', '56 cm²', '63 cm²'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Area of circle radius 14 cm =', options: ['616 cm²', '308 cm²', '154 cm²', '44 cm²'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If radius doubles, circumference becomes:', options: ['Same', 'Double', 'Triple', 'Half'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A rectangle has perimeter 34 cm and length 12 cm. Its diagonal =', options: ['10 cm', '12 cm', '13 cm', '15 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A square has diagonal 10 cm. Side length =', options: ['5√2 cm', '10√2 cm', '5 cm', '8 cm'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A man walks 6 km east then 8 km north. Straight distance =', options: ['10 km', '12 km', '14 km', '16 km'], correct: 0 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A rhombus has diagonals 16 cm and 12 cm. Side length =', options: ['8 cm', '10 cm', '12 cm', '14 cm'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'If two equal sides are x, hypotenuse =', options: ['x²', 'x√2', '2x', 'x/2'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A ladder reaches 12 m high wall, base is 5 m away. Ladder length =', options: ['11 m', '12 m', '13 m', '14 m'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'In a right triangle, hypotenuse = 25 cm, one side = 24 cm. Other side =', options: ['5 cm', '6 cm', '7 cm', '8 cm'], correct: 2 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Distance between points (0,0) and (3,4) =', options: ['4', '5', '6', '7'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'A tree breaks 9 m above ground and top touches ground 12 m away. Original height =', options: ['21 m', '24 m', '15 m', '18 m'], correct: 1 },
  { lesson: 'Geometry', difficulty: 'Hard', q: 'Two equal sides of a right triangle are 10 cm each. Hypotenuse =', options: ['10√2 cm', '20 cm', '5√2 cm', '14 cm'], correct: 0 },

  // ===== Algebra Easy =====
  { lesson: 'Algebra', difficulty: 'Easy', q: 'If x = 3, find 2x + 5.', options: ['8', '11', '10', '9'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Expand: (x + 2)(x + 3)', options: ['x² + 5x + 6', 'x² + 6', 'x² + x + 6', 'x² + 5x'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Simplify: (x/2) + (x/2)', options: ['x', '2x', 'x²', 'x/4'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Factorize: x² + 5x + 6', options: ['(x+1)(x+6)', '(x+2)(x+3)', '(x−2)(x−3)', '(x+5)(x+1)'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Simplify: (3a/4) − (a/4)', options: ['a/2', 'a', '2a', 'a/4'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Factorize: x² − 9', options: ['(x−9)(x+1)', '(x−3)(x+3)', '(x−9)²', '(x+9)(x−1)'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'If a = 2, b = 4, find ab.', options: ['6', '8', '4', '2'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Expand: (x − 1)(x + 1)', options: ['x² + 1', 'x² − 1', 'x² − 2x + 1', 'x² + 2x + 1'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Simplify: (5x/3) + (x/3)', options: ['6x', '2x', '2x/3', '6x/3'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Factorize: x² + 7x + 12', options: ['(x+3)(x+4)', '(x+2)(x+6)', '(x+1)(x+12)', '(x−3)(x−4)'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Solve: x + 4 = 9', options: ['3', '4', '5', '6'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'If A = l × w, find A when l = 6, w = 2', options: ['8', '10', '12', '14'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Solve: 2x = 8', options: ['2', '3', '4', '5'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Solve: x − 3 > 5', options: ['x > 8', 'x < 8', 'x = 8', 'x ≥ 8'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'If P = 2l + 2w, find P when l = 3, w = 4', options: ['10', '12', '14', '16'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Solve: x/3 = 4', options: ['7', '10', '12', '14'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Solve: x + 2 < 6', options: ['x < 4', 'x > 4', 'x = 4', 'x ≤ 4'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'If S = d/t, find S when d = 15, t = 3', options: ['3', '4', '5', '6'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Solve: 5x = 25', options: ['3', '4', '5', '6'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Make x the subject: y = x + 2', options: ['x = y + 2', 'x = y − 2', 'x = 2 − y', 'x = y/2'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Which of these is a function?', options: ['y = 2x', 'x + y', '2x = 4', 'x > 3'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Find y when x = 3 in y = 2x', options: ['3', '5', '6', '9'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'What is the gradient of y = 4x?', options: ['0', '4', 'x', '1'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'What is the y-intercept of y = x + 5?', options: ['0', '1', '5', 'x'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Does y = 3x pass through origin?', options: ['Yes', 'No', 'Sometimes', 'Cannot say'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Find y when x = 2 in y = x + 1', options: ['1', '2', '3', '4'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'What is the gradient of y = −2x + 3?', options: ['−2', '2', '3', '0'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'What type of graph is y = mx + c?', options: ['Circle', 'Curve', 'Straight line', 'Triangle'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Find x when y = 8 in y = 2x', options: ['2', '4', '6', '8'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Easy', q: 'Which line has zero gradient?', options: ['y = 3x', 'y = 5', 'y = x', 'y = −x'], correct: 1 },

  // ===== Algebra Medium =====
  { lesson: 'Algebra', difficulty: 'Medium', q: 'If x = −2, find x² + 3x.', options: ['−2', '−1', '2', '4'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Expand: (x + 4)(x − 2)', options: ['x² + 2x − 8', 'x² − 2x − 8', 'x² + 4x − 2', 'x² − 8'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Factorize: x² + x − 6', options: ['(x+3)(x−2)', '(x+2)(x−3)', '(x+6)(x−1)', '(x−6)(x+1)'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Simplify: (x/6) + (x/3)', options: ['x/2', 'x/3', 'x', 'x/6'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Factorize: 2x + 2y + ax + ay', options: ['(x+y)(a+2)', '(2+a)(x+y)', '(x+a)(y+2)', '(2x+a)(2y+a)'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Simplify: (3/x) + (2/x)', options: ['5/x', '6/x', '5x', 'x/5'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Expand: (2x + 1)(x + 3)', options: ['2x² + 7x + 3', '2x² + 6x + 1', 'x² + 7x + 3', '2x² + 4x + 3'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Factorize: x² − 16', options: ['(x−4)(x+4)', '(x−8)(x+2)', '(x−16)(x+1)', '(x−2)(x+8)'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Simplify: (a/5) − (2a/5)', options: ['a/5', '−a/5', '−a', 'a'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'If x = 2, y = 3, find x² + y².', options: ['10', '12', '13', '9'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Solve: 2(x + 3) = 12', options: ['2', '3', '4', '5'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Solve: 3x − 5 = 10', options: ['3', '4', '5', '6'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Solve: 4x ≤ 16', options: ['x ≤ 3', 'x ≤ 4', 'x ≥ 4', 'x = 4'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Make a the subject: P = 2a + b', options: ['a = P − b', 'a = (P − b)/2', 'a = P/2 + b', 'a = b − P'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'If v = u + at, find v when u = 3, a = 2, t = 4', options: ['9', '10', '11', '12'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Solve: 2x + 1 < 9', options: ['x < 3', 'x < 4', 'x > 4', 'x = 4'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Solve: x/2 = 7', options: ['12', '13', '14', '15'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Make t the subject: v = u + at', options: ['t = v − u', 't = (v − u)/a', 't = u/a', 't = a/v'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Solve: 5 + x > 9', options: ['x > 3', 'x > 4', 'x < 4', 'x = 4'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'If C = 2πr, find C when r = 7 (π = 22/7)', options: ['22', '44', '66', '88'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Are y = 2x + 1 and y = 2x − 3 parallel?', options: ['Yes', 'No', 'Intersect at origin', 'Same line'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Convert 2x + y = 6 to y = mx + c form:', options: ['y = 2x + 6', 'y = −2x + 6', 'y = 2x − 6', 'y = −2x − 6'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Which point lies on y = x + 2?', options: ['(1,1)', '(2,2)', '(1,3)', '(0,1)'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Which graph is steeper?', options: ['y = x', 'y = 5x', 'Same', 'Cannot say'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Find y when x = −1 in y = −3x + 2', options: ['−1', '5', '3', '1'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Equation with gradient 3 and intercept 2 is:', options: ['y = 2x + 3', 'y = 3x + 2', 'y = 3 + 2x', 'y = 2x − 3'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'What is intercept of y = 4x − 7?', options: ['4', '−7', '7', '0'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Which point lies on x + y = 4?', options: ['(1,1)', '(2,2)', '(3,3)', '(4,4)'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Gradient of a horizontal line is:', options: ['1', '−1', '0', 'Undefined'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Medium', q: 'Which is NOT parallel to y = 2x + 1?', options: ['y = 2x + 5', 'y = 2x − 1', 'y = 3x + 1', 'y = 2x'], correct: 2 },

  // ===== Algebra Hard =====
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Expand: (x + 5)(x − 5)', options: ['x² − 25', 'x² + 25', 'x² − 10x + 25', 'x² + 10x + 25'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Factorize: x² − x − 12', options: ['(x−4)(x+3)', '(x+4)(x−3)', '(x−6)(x+2)', '(x+6)(x−2)'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Simplify: (x/2) + (x/4)', options: ['3x/4', 'x/6', 'x/8', 'x'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'If x = −3, find (x + 2)(x − 1)', options: ['4', '6', '8', '10'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Factorize: x² + 9x + 20', options: ['(x+4)(x+5)', '(x+10)(x+2)', '(x+1)(x+20)', '(x−4)(x−5)'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Simplify: (2a/3) − (a/6)', options: ['a/2', 'a/3', 'a/6', '5a/6'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Expand: (x − 3)(x − 4)', options: ['x² − 7x + 12', 'x² + 7x + 12', 'x² − 12', 'x² − x + 12'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Factorize: 3x + 3y + 2x + 2y', options: ['5(x+y)', '6xy', '(3+2)(x−y)', '3x² + 2y²'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Simplify: (1/x) + (2/x) − (1/x)', options: ['1/x', '2/x', '3/x', 'x/2'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'If a = 2, b = −1, find a² + 2ab + b²', options: ['0', '1', '4', '9'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Solve simultaneously:x + y = 9, x − y = 3', options: ['x=6, y=3', 'x=5, y=4', 'x=4, y=5', 'x=7, y=2'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Solve: (x + 2)/3 = 5', options: ['11', '12', '13', '14'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Solve: 3(x − 1) + 2 = 11', options: ['3', '4', '5', '6'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Make x the subject: a = bx + c', options: ['x = (a − c)/b', 'x = (a + c)/b', 'x = b/(a − c)', 'x = a/b + c'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Solve: (x − 1)/2 ≥ 4', options: ['x ≥ 7', 'x ≥ 8', 'x ≤ 9', 'x = 9'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'If A = ½bh, find h when A = 24, b = 6', options: ['6', '7', '8', '9'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Solve: 5 − 2x < 1', options: ['x > 2', 'x < 2', 'x = 2', 'x ≥ 2'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'If I = PRT, find T when I = 120, P = 6, R = 4', options: ['4', '5', '6', '7'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Solve simultaneously:x + y = 8, y = 3', options: ['x=4', 'x=5', 'x=6', 'x=7'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Integral solutions of x < 4:', options: ['4,5,6', '1,2,3', '0,1,2,3', '3,4,5'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Line parallel to y = 2x + 1 through (0,4):', options: ['y = 2x + 4', 'y = x + 4', 'y = 4x + 2', 'y = 2x − 4'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Equation through (1,3) and (3,7):', options: ['y = 2x + 1', 'y = x + 2', 'y = 3x + 1', 'y = 2x − 1'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Intersection of y = x + 1 and y = 2x − 2 gives x =', options: ['1', '2', '3', '4'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Gradient of 3x + 2y = 6 is:', options: ['3/2', '−3/2', '−2/3', '2/3'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'If y = 2x + c passes through (1,5), c =', options: ['1', '2', '3', '4'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Which pair is parallel?', options: ['y=3x+1 and y=3x−5', 'y=3x+1 and y=2x+1', 'y=x and y=−x', 'y=4 and y=x'], correct: 0 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Through origin and (4,−8), equation is:', options: ['y = 2x', 'y = −2x', 'y = x − 2', 'y = −x'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Intercept of 2x + y = 8 on y-axis:', options: ['2', '4', '8', '−8'], correct: 2 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Taxi cost: Rs 100 fixed + Rs 50 per km. Function:', options: ['y = 100x + 50', 'y = 50x + 100', 'y = 150x', 'y = 50 + 100x'], correct: 1 },
  { lesson: 'Algebra', difficulty: 'Hard', q: 'Which line is perpendicular to y = x?', options: ['y = x + 2', 'y = −x', 'y = 2x', 'y = 3'], correct: 1 },

  // ===== Numbers Easy =====
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Find the next term: 2, 4, 6, 8, __', options: ['9', '10', '11', '12'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Find the 5th term: 3, 6, 9, 12, ...', options: ['12', '15', '18', '21'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Cost price = Rs.100, Selling price = Rs.120. Profit = ?', options: ['Rs.10', 'Rs.15', 'Rs.20', 'Rs.25'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Find the next term: 5, 10, 15, 20, __', options: ['22', '24', '25', '30'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Cost price = Rs.80, Selling price = Rs.70. Loss = ?', options: ['Rs.5', 'Rs.10', 'Rs.15', 'Rs.20'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Find the common difference: 7, 11, 15, 19', options: ['2', '3', '4', '5'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Discount on Rs.500 item at 10% = ?', options: ['40', '45', '50', '55'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Round off 47 to nearest ten', options: ['40', '45', '50', '60'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Write 3000 in scientific notation', options: ['3 × 10²', '3 × 10³', '30 × 10²', '0.3 × 10⁴'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Convert 5₁₀ to binary', options: ['101', '110', '111', '100'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Convert 101₂ to decimal', options: ['4', '5', '6', '7'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Convert 2₁₀ to binary', options: ['1', '10', '11', '100'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Convert 8₁₀ to binary', options: ['1000', '1111', '1010', '1100'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Simplify: ½ of 8', options: ['2', '3', '4', '5'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Simplify: ¾ of 8', options: ['4', '5', '6', '7'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Simplify: 505⁰', options: ['0', '1', '5', '25'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Easy', q: 'Simplify: 2.5 × 10² in normal form', options: ['25', '250', '2500', '0.25'], correct: 1 },

  // ===== Numbers Medium =====
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Find the 10th term of: 2, 5, 8, 11, ...', options: ['26', '27', '28', '29'], correct: 3 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'General term of: 4, 7, 10, 13, ...', options: ['3n + 1', '3n + 2', '4n', 'n + 3'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Find the next term: 1, 4, 7, 10, __', options: ['12', '13', '14', '15'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Find the 6th term of: 5, 9, 13, 17, ...', options: ['21', '25', '29', '33'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Cost price = Rs.200, Selling price = Rs.250. Profit % = ?', options: ['20%', '25%', '30%', '35%'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Marked price = Rs.1000, Discount = 15%. Selling price = ?', options: ['800', '850', '900', '950'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Loss of Rs.30 on cost price Rs.150. Loss % = ?', options: ['10%', '15%', '20%', '25%'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Simplify: 2³ × 2²', options: ['25', '26', '45', '32'], correct: 3 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Simplify: (2³)²', options: ['25', '26', '43', '16'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Simplify: 3⁴ ÷ 3²', options: ['3²', '3⁶', '11', '9³'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Add: 101₂ + 10₂', options: ['110', '111', '1000', '1011'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Subtract: 110₂ − 1₂', options: ['100', '101', '110', '111'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Convert 111₂ to decimal', options: ['5', '6', '7', '8'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Simplify: ½ + ¼', options: ['2/4', '3/4', '1', '5/4'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Solve: ½(6 + 2)', options: ['2', '3', '4', '8'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Solve using BODMAS: ½ × 6 + 2', options: ['3', '4', '5', '6'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Round off 5.67 to nearest whole number', options: ['5', '5.5', '6', '7'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Round off 8642 to nearest thousand', options: ['8000', '8500', '9000', '8600'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Write 0.0045 in scientific notation', options: ['4.5 × 10⁻³', '4.5 × 10⁻⁴', '45 × 10⁻³', '0.45 × 10⁻²'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Convert 13₁₀ to binary', options: ['1011', '1101', '1110', '1001'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Medium', q: 'Convert 111₂ to decimal', options: ['5', '6', '7', '8'], correct: 2 },

  // ===== Numbers Hard =====
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Find the 20th term of: 3, 7, 11, 15, ...', options: ['75', '76', '77', '79'], correct: 3 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'If nth term = 5n − 2, find 8th term', options: ['36', '38', '40', '42'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Find n if nth term of 2, 5, 8, ... is 29', options: ['8', '9', '10', '11'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Cost price = Rs.500, profit = 20%. Selling price = ?', options: ['550', '580', '600', '620'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Marked price = Rs.1200, discount = 25%. Selling price = ?', options: ['800', '850', '900', '950'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Commission = 5% of Rs.8000 sales. Commission = ?', options: ['300', '350', '400', '450'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Trader buys for Rs.900 and sells for Rs.810. Loss % = ?', options: ['5%', '8%', '10%', '12%'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Simplify: 2⁻²', options: ['4', '1/2', '1/4', '−4'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Simplify: 3² × 3⁻¹', options: ['3', '6', '9', '1/3'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Simplify: 5³ / 5⁵', options: ['5²', '5⁻²', '25', '125'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Add: 1011₂ + 110₂', options: ['10001', '10010', '10011', '10100'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Subtract: 1000₂ − 11₂', options: ['100', '101', '110', '111'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Convert 10010₂ to decimal', options: ['16', '18', '20', '22'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Convert 4510₁₀ to binary', options: ['101101', '110101', '101011', '111001'], correct: 0 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Simplify: ¾(8 − 4)', options: ['2', '3', '4', '5'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Solve using BODMAS: ½(4 + 6) − 1', options: ['3', '4', '5', '6'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Simplify: 2/3 + 1/6', options: ['1/2', '3/6', '5/6', '1'], correct: 2 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Write 5,600,000 in scientific notation', options: ['5.6 × 10⁵', '5.6 × 10⁶', '56 × 10⁵', '0.56 × 10⁷'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'Round off 9.876 to 2 decimal places', options: ['9.87', '9.88', '9.90', '9.80'], correct: 1 },
  { lesson: 'Numbers', difficulty: 'Hard', q: 'A number rounded to nearest hundred gives 2300. Which could it be?', options: ['2249', '2251', '2399', 'Both B and C'], correct: 1 },
];

async function seed() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!MONGO_URI) throw new Error('❌ MONGO_URI or MONGODB_URI not found in question-service/.env');

    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find the Grade 9 coordinator by email
    const COORDINATOR_EMAIL = 'grade9@gmail.com';
    const usersCollection = mongoose.connection.collection('users');
    const coordinator = await usersCollection.findOne({ email: COORDINATOR_EMAIL });

    if (!coordinator) {
      const allUsers = await usersCollection.find({}, { projection: { email: 1, role: 1, grade: 1 } }).toArray();
      console.log('\n📋 Existing users in database:');
      allUsers.forEach(u => console.log(`   - ${u.email} (role: ${u.role}, grade: ${u.grade})`));
      throw new Error(`\n❌ User with email ${COORDINATOR_EMAIL} not found.`);
    }

    if (coordinator.role !== 'ADMIN') {
      throw new Error(`❌ ${COORDINATOR_EMAIL} has role "${coordinator.role}", expected "ADMIN" (year coordinator).`);
    }

    console.log(`✅ Using coordinator: ${coordinator.email}`);
    console.log(`   Role: ${coordinator.role}, Grade: ${coordinator.grade}`);

    // ---- Wipe existing questions for Grade 9 ----
    const deleted = await Question.deleteMany({ grade: 'GRADE_9' });
    console.log(`🗑️  Removed ${deleted.deletedCount} existing Grade 9 question(s)`);

    // ---- Build documents ----
    const docs = QUESTIONS.map(({ lesson, difficulty, q, options, correct }) => ({
      lesson,
      difficulty,
      questionText: q,
      answers: options.map((text, idx) => ({ text, isCorrect: idx === correct })),
      createdBy: coordinator._id,
      grade: 'GRADE_9',
    }));

    // ---- Sanity check: every question must have exactly one correct answer ----
    const bad = docs.filter(d => d.answers.filter(a => a.isCorrect).length !== 1);
    if (bad.length) {
      throw new Error(`❌ ${bad.length} question(s) do not have exactly one correct answer`);
    }

    const result = await Question.insertMany(docs);
    console.log(`\n✅ Successfully inserted ${result.length} questions`);

    // ---- Distribution report ----
    console.log('\n📊 Distribution:');
    const counts = {};
    docs.forEach(d => {
      const key = `${d.lesson}|${d.difficulty}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    Object.keys(counts).sort().forEach(k => {
      const [lesson, difficulty] = k.split('|');
      console.log(`   ${lesson.padEnd(10)} - ${difficulty.padEnd(7)}: ${counts[k]} questions`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

seed();