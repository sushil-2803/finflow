const express = require('express');
const router = express.Router();
const {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  closeBudget,
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// Protect all routes
router.use(protect);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be an integer between 1 and 12'),
    body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid four digit year'),
    body('startDate').isISO8601().toDate().withMessage('Start date must be a valid ISO8601 date'),
    body('endDate').isISO8601().toDate().withMessage('End date must be a valid ISO8601 date'),
    body('budgetAmount').isFloat({ min: 0 }).withMessage('Budget amount must be a positive number'),
    validate
  ],
  createBudget
);

router.get('/', getBudgets);

router.get('/:id', getBudgetById);

router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
    body('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO8601 date'),
    body('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO8601 date'),
    body('budgetAmount').optional().isFloat({ min: 0 }).withMessage('Budget amount must be a positive number'),
    validate
  ],
  updateBudget
);

router.delete('/:id', deleteBudget);

router.post('/:id/close', closeBudget);

module.exports = router;
