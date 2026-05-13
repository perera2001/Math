/**
 * One-time migration: convert questionText and answers[].text from plain strings
 * to multilingual objects { en, si, ta }.
 *
 * Usage:
 *   cd question-service
 *   node scripts/migrate-to-multilingual.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

// Flexible schema — no strict validation so we can read the legacy string format
const RawQuestion = mongoose.model(
  'RawQuestion',
  new mongoose.Schema({}, { strict: false, collection: 'questions' })
);

const migrate = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find all documents where questionText is still a plain string
  const toMigrate = await RawQuestion.find({ questionText: { $type: 'string' } }).lean();
  console.log(`Found ${toMigrate.length} question(s) to migrate`);

  if (toMigrate.length === 0) {
    console.log('Nothing to migrate. All questions already use the multilingual format.');
    await mongoose.disconnect();
    return;
  }

  let migrated = 0;
  for (const doc of toMigrate) {
    const newQuestionText = { en: doc.questionText || '', si: '', ta: '' };
    const newAnswers = (doc.answers || []).map((a) => ({
      ...a,
      text: typeof a.text === 'string' ? { en: a.text, si: '', ta: '' } : a.text,
    }));

    await RawQuestion.updateOne(
      { _id: doc._id },
      { $set: { questionText: newQuestionText, answers: newAnswers } }
    );
    migrated++;
  }

  console.log(`Migrated ${migrated} question(s) successfully.`);
  console.log('');
  console.log('NOTE: Existing questions now have si="" and ta="" (English only).');
  console.log('Use the Edit Question form to add translations, or re-seed:');
  console.log('  node scripts/seed-questions.js    (replaces all questions with fresh seed data)');

  await mongoose.disconnect();
  console.log('Done.');
};

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
