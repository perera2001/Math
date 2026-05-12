// question-service/scripts/diagnose-db.js
//
// Run from the SAME directory you ran seed-questions.js from:
//   node .\diagnose-db.js
//
// Tells you exactly which Mongo URI, database, and collections the seed
// script is actually connecting to, and how many question-like documents
// each collection holds. The dashboard is clearly reading from a different
// place than the seed is writing to — this script shows you where.

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Always load service-level .env even when running from scripts/.
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

async function main() {
  const URI = process.env.MONGO_URI || process.env.MONGODB_URI;

  console.log("--- Process / env ---");
  console.log("cwd                :", process.cwd());
  console.log("script dir         :", __dirname);
  console.log(
    ".env in cwd?       :",
    fs.existsSync(path.join(process.cwd(), ".env")),
  );
  console.log(
    ".env in parent?    :",
    fs.existsSync(path.join(process.cwd(), "..", ".env")),
  );
  console.log(
    "MONGO_URI (masked) :",
    URI ? URI.replace(/:\/\/[^@]+@/, "://***:***@") : "(not set)",
  );

  if (!URI) {
    console.error(
      "\n❌ No MONGO_URI / MONGODB_URI in environment. dotenv probably did not find a .env file.",
    );
    process.exit(1);
  }

  await mongoose.connect(URI);
  const db = mongoose.connection.db;

  console.log("\n--- Connected ---");
  console.log("Database name      :", db.databaseName);

  const collections = await db.listCollections().toArray();
  console.log(
    "Collections        :",
    collections.map((c) => c.name).join(", "),
  );

  console.log("\n--- Per-collection counts ---");
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`  ${c.name.padEnd(30)} ${count} docs`);
  }

  // Anything question-shaped?
  console.log("\n--- Question-like collections (deep look) ---");
  for (const c of collections) {
    if (!/quest/i.test(c.name)) continue;
    const coll = db.collection(c.name);
    const total = await coll.countDocuments();
    const g9 = await coll.countDocuments({ grade: "GRADE_9" });
    console.log(`\n  ${c.name}: total=${total}, grade='GRADE_9'=${g9}`);

    const sample = await coll.findOne();
    if (sample) {
      let questionPreview = "";
      if (typeof sample.questionText === "string") {
        questionPreview = sample.questionText.slice(0, 80);
      } else if (sample.questionText && typeof sample.questionText === "object") {
        // Support multilingual/object-based question text shapes.
        questionPreview = JSON.stringify(sample.questionText).slice(0, 80);
      } else {
        questionPreview = String(sample.questionText || "").slice(0, 80);
      }

      console.log(
        `  sample document fields: ${Object.keys(sample).join(", ")}`,
      );
      console.log(
        `  sample lesson/difficulty/grade: ${sample.lesson} / ${sample.difficulty} / ${sample.grade}`,
      );
      console.log(
        `  sample questionText: ${questionPreview}`,
      );
    }

    // Distribution
    const dist = await coll
      .aggregate([
        {
          $group: {
            _id: { lesson: "$lesson", difficulty: "$difficulty" },
            n: { $sum: 1 },
          },
        },
        { $sort: { "_id.lesson": 1, "_id.difficulty": 1 } },
      ])
      .toArray();
    if (dist.length) {
      console.log("  distribution:");
      dist.forEach((d) =>
        console.log(
          `    ${(d._id.lesson || "?").padEnd(10)} ${(d._id.difficulty || "?").padEnd(7)} ${d.n}`,
        ),
      );
    }
  }

  // If the seed model writes to a collection by a name Mongoose chose for itself,
  // it would default to 'questions'. Confirm explicitly.
  const explicit = db.collection("questions");
  const explicitCount = await explicit.countDocuments();
  console.log(`\n'questions' collection direct count: ${explicitCount}`);

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
