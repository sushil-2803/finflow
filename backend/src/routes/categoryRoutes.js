const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { getCategories, createCategory } = require('../controllers/categoryController');

router.use(protect);

router.get('/', getCategories);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Category name is required').trim(),
    validate
  ],
  createCategory
);

module.exports = router;
