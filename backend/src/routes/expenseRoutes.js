const express = require('express');
const router = express.Router();
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// Protect all routes
router.use(protect);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('category').optional().trim(),
    body('paymentMethod')
      .isIn(['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'])
      .withMessage('Invalid payment method'),
    body('expenseDate').optional().isISO8601().toDate().withMessage('Date must be a valid ISO8601 date'),
    body('budgetId').optional({ nullable: true }).isMongoId().withMessage('Invalid budget ID'),
    body('groupId').optional({ nullable: true }).isMongoId().withMessage('Invalid group ID'),
    body('isSpentFromSavings').optional().isBoolean().withMessage('isSpentFromSavings must be a boolean'),
    validate
  ],
  createExpense
);

router.get('/', getExpenses);

router.get('/:id', getExpenseById);

router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('category').optional().trim(),
    body('paymentMethod')
      .optional()
      .isIn(['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'])
      .withMessage('Invalid payment method'),
    body('expenseDate').optional().isISO8601().toDate().withMessage('Date must be a valid ISO8601 date'),
    body('budgetId').optional({ nullable: true }).isMongoId().withMessage('Invalid budget ID'),
    body('groupId').optional({ nullable: true }).isMongoId().withMessage('Invalid group ID'),
    body('isSpentFromSavings').optional().isBoolean().withMessage('isSpentFromSavings must be a boolean'),
    validate
  ],
  updateExpense
);

router.delete('/:id', deleteExpense);

module.exports = router;
