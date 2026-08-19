const express = require('express');
const router = express.Router();
const {
  getSavings,
  spendSavings,
  depositSavings,
  getSavingsHistory,
} = require('../controllers/savingsController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// Protect all routes
router.use(protect);

router.get('/', getSavings);

router.post(
  '/spend',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),
    body('transactionDate').optional().isISO8601().toDate().withMessage('Transaction date must be a valid ISO8601 date'),
    validate
  ],
  spendSavings
);

router.post(
  '/deposit',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),
    body('transactionDate').optional().isISO8601().toDate().withMessage('Transaction date must be a valid ISO8601 date'),
    validate
  ],
  depositSavings
);

router.get('/history', getSavingsHistory);

module.exports = router;
