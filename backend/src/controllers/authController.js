const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const client = googleClientId ? new OAuth2Client(googleClientId) : null;

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res, next) => {
  const { credential } = req.body;

  try {
    if (!client || !googleClientId) {
      return res.status(500).json({
        success: false,
        message: 'Google authentication is not configured on the server',
      });
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error('Google OAuth token verification failed:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
    }

    if (!payload?.email || !payload?.sub) {
      return res.status(401).json({
        success: false,
        message: 'Google token is missing required profile information',
      });
    }

    const userData = {
      googleId: payload.sub,
      name: payload.name || payload.email,
      email: payload.email,
      avatar: payload.picture,
    };

    // Find or create User
    let user = await User.findOne({ email: userData.email });

    if (!user) {
      user = new User({
        name: userData.name,
        email: userData.email,
        googleId: userData.googleId,
        avatar: userData.avatar,
        overallSavings: 0,
      });
      await user.save();
    } else if (!user.googleId && userData.googleId) {
      // Update googleId/avatar if user exists but registered differently
      user.googleId = userData.googleId;
      user.avatar = userData.avatar || user.avatar;
      await user.save();
    }

    // Generate JWT access & refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt,
    });

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        overallSavings: user.overallSavings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  try {
    // Check if token exists in DB
    const storedToken = await RefreshToken.findOne({ token });
    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    // Check if token has expired in DB
    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ _id: storedToken._id });
      return res.status(401).json({
        success: false,
        message: 'Refresh token has expired, please log in again',
      });
    }

    // Verify token using JWT
    const decoded = jwtVerifyRefresh(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token structure',
      });
    }

    // Get user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

// Helper for verifying refresh token inside auth controller (to avoid circular dependency issues)
const jwtVerifyRefresh = (token) => {
  const jwt = require('jsonwebtoken');
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    return null;
  }
};

// @desc    Log User Out (Invalidate refresh token)
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
  const { refreshToken: token } = req.body;

  try {
    if (token) {
      await RefreshToken.deleteOne({ token });
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        overallSavings: user.overallSavings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  googleLogin,
  refreshToken,
  logout,
  getMe,
};
