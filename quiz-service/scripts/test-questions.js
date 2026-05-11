const mongoose = require("mongoose");
require("dotenv").config();

async function test() {
  console.log("🔗 MONGODB_URI:", process.env.MONGODB_URI);

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection;

  console.log("📂 Connected to database:", db.name);

  // List all collections
  const collections = await db.db.listCollections().toArray();
  console.log(
    "📋 Collections in this DB:",
    collections.map((c) => c.name),
  );

  // Count questions
  const totalCount = await db.collection("questions").countDocuments();
  console.log(`📊 Total questions in this DB: ${totalCount}`);

  // Try the exact query that quiz-service is making
  const matching = await db.collection("questions").countDocuments({
    lesson: "Geometry",
    difficulty: "Easy",
    grade: 9,
  });
  console.log(`🎯 Geometry / Easy / Grade 9: ${matching} questions`);

  // Sample a question to see structure
  const sample = await db
    .collection("questions")
    .findOne({ lesson: "Geometry" });
  if (sample) {
    console.log("📝 Sample question structure:");
    console.log(`   lesson: "${sample.lesson}" (${typeof sample.lesson})`);
    console.log(
      `   difficulty: "${sample.difficulty}" (${typeof sample.difficulty})`,
    );
    console.log(`   grade: ${sample.grade} (${typeof sample.grade})`);
  } else {
    console.log("❌ No questions found in this database!");
  }

  await mongoose.disconnect();
}

test();
