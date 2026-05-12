const express = require('express');
const { verifyUser, requireCoordinator } = require('../middleware/authMiddleware');
const {
  create,
  getAll,
  getOne,
  update,
  remove,
  getStats,
  translate,
} = require('../controllers/questionController');

const router = express.Router();

router.use(verifyUser);
router.use(requireCoordinator);

router.post('/translate', translate);
router.post('/', create);
router.get('/', getAll);
router.get('/stats', getStats);
router.get('/:id', getOne);
router.put('/:id', update);
router.delete('/:id', remove);

module.exports = router;
