const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;

  // Get the coordinator
  const user = await db.collection('users').findOne({ email: 'grade9@gmail.com' });
  console.log('\n👤 Coordinator:');
  console.log(`   _id:   ${user._id}`);
  console.log(`   role:  ${user.role}`);
  console.log(`   grade: ${user.grade}  (type: ${typeof user.grade})`);

  // Get sample questions
  const questions = await db.collection('questions').find({}).limit(3).toArray();
  console.log(`\n📚 Sample questions (${await db.collection('questions').countDocuments()} total):`);
  questions.forEach(q => {
    console.log(`   - ${q.questionText} | grade: ${q.grade} (type: ${typeof q.grade}) | createdBy: ${q.createdBy}`);
  });

  // Check if createdBy matches the coordinator
  const matching = await db.collection('questions').countDocuments({ createdBy: user._id });
  console.log(`\n🔗 Questions created by grade9@gmail.com: ${matching}`);

  await mongoose.disconnect();
}

check();