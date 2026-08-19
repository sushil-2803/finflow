const express = require('express');
const router = express.Router();
const {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// Protect all routes
router.use(protect);

router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('startDate').isISO8601().toDate().withMessage('Start date must be a valid ISO8601 date'),
    body('budgetLimit').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget limit must be a positive number'),
    body('isBudgetEnabled').optional().isBoolean().withMessage('isBudgetEnabled must be a boolean'),
    body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status'),
    validate
  ],
  createGroup
);

router.get('/', getGroups);

router.get('/:id', getGroupById);

router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty').trim(),
    body('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO8601 date'),
    body('budgetLimit').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Budget limit must be a positive number'),
    body('isBudgetEnabled').optional().isBoolean().withMessage('isBudgetEnabled must be a boolean'),
    body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Invalid status'),
    validate
  ],
  updateGroup
);

router.delete('/:id', deleteGroup);

module.exports = router;
