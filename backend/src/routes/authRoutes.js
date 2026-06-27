const express = require('express');
const router = express.Router();
const { googleLogin, refreshToken, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

// Public routes
router.post(
  '/google',
  [
    body('credential').notEmpty().withMessage('Google credential is required').isString().withMessage('Credential must be a string'),
    validate
  ],
  googleLogin
);

router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate
  ],
  refreshToken
);

router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
