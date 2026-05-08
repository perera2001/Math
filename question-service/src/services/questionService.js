const Question = require('../models/Question');

const createQuestion = async (data, userId) => {
  const question = await Question.create({
    ...data,
    createdBy: userId,
  });
  return question;
};

const getAllQuestions = async (filters = {}) => {
  const query = {};

  if (filters.lesson) {
    query.lesson = filters.lesson;
  }

  if (filters.difficulty) {
    query.difficulty = filters.difficulty;
  }

  if (filters.grade !== undefined && filters.grade !== null) {
    query.grade = filters.grade;
  }

  const questions = await Question.find(query).sort({ createdAt: -1 });
  return questions;
};

const getQuestionById = async (id) => {
  const question = await Question.findById(id);
  if (!question) {
    const err = new Error('Question not found');
    err.statusCode = 404;
    throw err;
  }
  return question;
};

const updateQuestion = async (id, data) => {
  const question = await Question.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!question) {
    const err = new Error('Question not found');
    err.statusCode = 404;
    throw err;
  }

  return question;
};

const deleteQuestion = async (id) => {
  const question = await Question.findByIdAndDelete(id);

  if (!question) {
    const err = new Error('Question not found');
    err.statusCode = 404;
    throw err;
  }

  return question;
};

const getQuestionStats = async (grade = null) => {
  const pipeline = [];

  if (grade !== null && grade !== undefined) {
    pipeline.push({ $match: { grade } });
  }

  pipeline.push({
    $group: {
      _id: { lesson: '$lesson', difficulty: '$difficulty' },
      count: { $sum: 1 },
    },
  });

  const stats = await Question.aggregate(pipeline);

  const result = {
    Geometry: { Easy: 0, Medium: 0, Hard: 0, total: 0 },
    Algebra: { Easy: 0, Medium: 0, Hard: 0, total: 0 },
    Numbers: { Easy: 0, Medium: 0, Hard: 0, total: 0 },
  };

  stats.forEach((item) => {
    const { lesson, difficulty } = item._id;
    if (result[lesson]) {
      result[lesson][difficulty] = item.count;
      result[lesson].total += item.count;
    }
  });

  return result;
};

module.exports = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionStats,
};
