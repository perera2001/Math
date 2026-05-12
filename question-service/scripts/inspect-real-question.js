// question-service/scripts/inspect-real-question.js
//
// Read-only. Connects to Mongo and dumps one full real (grade='9') question
// document so we can see the exact shape of `answers` and `createdBy`.
// Also dumps one of my wrongly-inserted docs (grade='GRADE_9') for contrast.

const mongoose = require('mongoose');
const path = require('path');

// Always load service-level .env even when running from scripts/.
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function main() {
  const URI = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!URI) {
    throw new Error('MONGO_URI or MONGODB_URI not found in question-service/.env');
  }
  await mongoose.connect(URI);
  const coll = mongoose.connection.db.collection('questions');

  const real = await coll.findOne({ grade: '9' });
  const mine = await coll.findOne({ grade: 'GRADE_9' });

  console.log('\n========= ONE REAL (grade="9") QUESTION =========');
  console.log(JSON.stringify(real, null, 2));

  console.log('\n========= ONE OF MINE (grade="GRADE_9") =========');
  console.log(JSON.stringify(mine, null, 2));

  // Also check: is `grade` perhaps a Number instead of a String?
  const asNumber = await coll.countDocuments({ grade: 9 });
  const asString = await coll.countDocuments({ grade: '9' });
  console.log(`\nDocs with grade === 9 (Number) : ${asNumber}`);
  console.log(`Docs with grade === '9' (String): ${asString}`);

  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });