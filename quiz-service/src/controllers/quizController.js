const quizService = require('../services/quizService');

const start = async (req, res, next) => {
  try {
    const { grade, lesson, difficulty, timeMode } = req.body;

    if (!grade || !lesson || !difficulty || !timeMode) {
      return res.status(400).json({ message: 'grade, lesson, difficulty, and timeMode are required' });
    }

    const result = await quizService.startQuiz({
      grade,
      lesson,
      difficulty,
      timeMode,
      userId: req.user.id,
    });

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const answer = async (req, res, next) => {
  try {
    const { sessionId, questionIndex, answerIndex, timeSpent } = req.body;

    if (sessionId === undefined || questionIndex === undefined || answerIndex === undefined) {
      return res.status(400).json({ message: 'sessionId, questionIndex, and answerIndex are required' });
    }

    const result = await quizService.answerQuestion({
      sessionId,
      questionIndex,
      answerIndex,
      timeSpent,
      userId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const lifeline = async (req, res, next) => {
  try {
    const { sessionId, type } = req.body;
    const allowed = ['fiftyFifty', 'skip', 'extraTime'];

    if (!sessionId || !type) {
      return res.status(400).json({ message: 'sessionId and type are required' });
    }
    if (!allowed.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${allowed.join(', ')}` });
    }

    const result = await quizService.useLifeline({
      sessionId,
      type,
      userId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const { sessionId, timeSpentTotal } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const result = await quizService.completeQuiz({
      sessionId,
      timeSpentTotal,
      userId: req.user.id,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const history = async (req, res, next) => {
  try {
    const sessions = await quizService.getHistory(req.user.id);
    return res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

const stats = async (req, res, next) => {
  try {
    const userStats = await quizService.getStats(req.user.id);
    return res.status(200).json({ stats: userStats });
  } catch (error) {
    next(error);
  }
};

module.exports = { start, answer, lifeline, complete, history, stats };
