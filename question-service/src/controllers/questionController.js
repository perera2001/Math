const questionService = require('../services/questionService');

const create = async (req, res, next) => {
  try {
    const { lesson, difficulty, questionText, answers, grade } = req.body;

    if (!lesson || !difficulty || !questionText || !answers) {
      return res.status(400).json({
        message: 'Lesson, difficulty, questionText, and answers are required',
      });
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      return res.status(400).json({
        message: 'At least 2 answers are required',
      });
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    if (correctCount !== 1) {
      return res.status(400).json({
        message: 'Exactly one answer must be marked as correct',
      });
    }

    const question = await questionService.createQuestion(
      { lesson, difficulty, questionText, answers, grade },
      req.user.id
    );

    return res.status(201).json({
      message: 'Question created successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { lesson, difficulty } = req.query;
    const questions = await questionService.getAllQuestions({ lesson, difficulty });

    return res.status(200).json({
      message: 'Questions retrieved successfully',
      count: questions.length,
      questions,
    });
  } catch (error) {
    next(error);
  }
};

const getOne = async (req, res, next) => {
  try {
    const question = await questionService.getQuestionById(req.params.id);

    return res.status(200).json({
      message: 'Question retrieved successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { lesson, difficulty, questionText, answers, grade } = req.body;

    if (answers) {
      if (!Array.isArray(answers) || answers.length < 2) {
        return res.status(400).json({
          message: 'At least 2 answers are required',
        });
      }

      const correctCount = answers.filter((a) => a.isCorrect).length;
      if (correctCount !== 1) {
        return res.status(400).json({
          message: 'Exactly one answer must be marked as correct',
        });
      }
    }

    const question = await questionService.updateQuestion(req.params.id, {
      lesson,
      difficulty,
      questionText,
      answers,
      grade,
    });

    return res.status(200).json({
      message: 'Question updated successfully',
      question,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await questionService.deleteQuestion(req.params.id);

    return res.status(200).json({
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await questionService.getQuestionStats();

    return res.status(200).json({
      message: 'Question stats retrieved successfully',
      stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { create, getAll, getOne, update, remove, getStats };
