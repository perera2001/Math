const express = require('express');
const { verifyUser, requireStudent } = require('../middleware/authMiddleware');
const { start, answer, lifeline, complete, history, stats } = require('../controllers/quizController');

const router = express.Router();

router.use(verifyUser);
router.use(requireStudent);

router.post('/start', start);
router.post('/answer', answer);
router.post('/lifeline', lifeline);
router.post('/complete', complete);
router.get('/history', history);
router.get('/stats', stats);

module.exports = router;
