// question-service/seed-questions.js
const mongoose = require('mongoose');
require('dotenv').config();

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

const distributions = [
  { lesson: 'Geometry', difficulty: 'Easy',   count: 8 },
  { lesson: 'Geometry', difficulty: 'Medium', count: 8 },
  { lesson: 'Algebra',  difficulty: 'Easy',   count: 8 },
  { lesson: 'Algebra',  difficulty: 'Hard',   count: 8 },
  { lesson: 'Numbers',  difficulty: 'Medium', count: 8 },
  { lesson: 'Numbers',  difficulty: 'Hard',   count: 8 },
];

async function seed() {
  try {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!MONGO_URI) throw new Error('❌ MONGO_URI not found in .env file');

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

    // Verify they are an ADMIN (year coordinator)
    if (coordinator.role !== 'ADMIN') {
      throw new Error(`❌ ${COORDINATOR_EMAIL} has role "${coordinator.role}", expected "ADMIN" (year coordinator).`);
    }

    console.log(`✅ Using coordinator: ${coordinator.email}`);
    console.log(`   Role: ${coordinator.role}, Grade: ${coordinator.grade}`);

    // Optional: Remove old test questions (uncomment if re-running)
    // const deleted = await Question.deleteMany({ questionText: /^Question \d+$/ });
    // console.log(`🗑️  Removed ${deleted.deletedCount} old test questions`);

    const questions = [];
    let questionNumber = 1;

    distributions.forEach(({ lesson, difficulty, count }) => {
      for (let i = 0; i < count; i++) {
        const correctIndex = Math.floor(Math.random() * 4);
        questions.push({
          lesson,
          difficulty,
          questionText: `Question ${questionNumber}`,
          answers: [
            { text: 'A', isCorrect: correctIndex === 0 },
            { text: 'B', isCorrect: correctIndex === 1 },
            { text: 'C', isCorrect: correctIndex === 2 },
            { text: 'D', isCorrect: correctIndex === 3 },
          ],
          createdBy: coordinator._id,
          grade: 'GRADE_9',
        });
        questionNumber++;
      }
    });

    const result = await Question.insertMany(questions);
    console.log(`\n✅ Successfully inserted ${result.length} questions\n`);

    console.log('📊 Distribution:');
    distributions.forEach(d => {
      console.log(`   ${d.lesson.padEnd(10)} - ${d.difficulty.padEnd(7)}: ${d.count} questions`);
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