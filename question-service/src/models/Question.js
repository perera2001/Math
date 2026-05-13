const mongoose = require('mongoose');

const multilingualTextSchema = {
  en: { type: String, trim: true, default: '' },
  si: { type: String, trim: true, default: '' },
  ta: { type: String, trim: true, default: '' },
};

const answerSchema = new mongoose.Schema(
  {
    text: {
      en: { type: String, required: [true, 'Answer text (en) is required'], trim: true },
      si: { type: String, trim: true, default: '' },
      ta: { type: String, trim: true, default: '' },
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    lesson: {
      type: String,
      enum: {
        values: ['Geometry', 'Algebra', 'Numbers'],
        message: 'Lesson must be Geometry, Algebra, or Numbers',
      },
      required: [true, 'Lesson is required'],
    },
    difficulty: {
      type: String,
      enum: {
        values: ['Easy', 'Medium', 'Hard'],
        message: 'Difficulty must be Easy, Medium, or Hard',
      },
      required: [true, 'Difficulty is required'],
    },
    questionText: {
      en: {
        type: String,
        required: [true, 'Question text (en) is required'],
        trim: true,
        minlength: [10, 'Question text must be at least 10 characters'],
      },
      si: { type: String, trim: true, default: '' },
      ta: { type: String, trim: true, default: '' },
    },
    answers: {
      type: [answerSchema],
      validate: [
        {
          validator: function (arr) {
            return arr.length >= 2;
          },
          message: 'A question must have at least 2 answers',
        },
        {
          validator: function (arr) {
            const correctCount = arr.filter((a) => a.isCorrect).length;
            return correctCount === 1;
          },
          message: 'A question must have exactly one correct answer',
        },
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator ID is required'],
    },
    grade: {
      type: Number,
      default: 9,
      min: [1, 'Grade must be at least 1'],
      max: [12, 'Grade cannot exceed 12'],
    },
  },
  {
    timestamps: true,
  }
);

questionSchema.index({ lesson: 1, difficulty: 1 });
questionSchema.index({ createdBy: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
