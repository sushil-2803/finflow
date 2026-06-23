const User = require('../models/User');
const SavingsTransaction = require('../models/SavingsTransaction');

// @desc    Get overall savings status
// @route   GET /api/savings
// @access  Private
const getSavings = async (req, res, next) => {
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
      overallSavings: user.overallSavings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Spend from accumulated savings
// @route   POST /api/savings/spend
// @access  Private
const spendSavings = async (req, res, next) => {
  const { title, amount, purpose, transactionDate } = req.body;
  const spendAmount = parseFloat(amount);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has sufficient savings
    if (user.overallSavings < spendAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient savings balance. You have ₹${user.overallSavings} but tried to spend ₹${spendAmount}.`,
      });
    }

    // Deduct from overall savings
    user.overallSavings -= spendAmount;
    await user.save();

    // Log the transaction
    const transaction = new SavingsTransaction({
      userId: req.user.id,
      title,
      amount: spendAmount,
      type: 'withdrawal',
      purpose,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Savings transaction recorded successfully',
      overallSavings: user.overallSavings,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add money directly to accumulated savings
// @route   POST /api/savings/deposit
// @access  Private
const depositSavings = async (req, res, next) => {
  const { title, amount, purpose, transactionDate } = req.body;
  const depositAmount = parseFloat(amount);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.overallSavings += depositAmount;
    await user.save();

    const transaction = new SavingsTransaction({
      userId: req.user.id,
      title,
      amount: depositAmount,
      type: 'deposit',
      purpose,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Savings deposit recorded successfully',
      overallSavings: user.overallSavings,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get savings spending transaction history
// @route   GET /api/savings/history
// @access  Private
const getSavingsHistory = async (req, res, next) => {
  try {
    const transactions = await SavingsTransaction.find({ userId: req.user.id })
      .sort({ transactionDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavings,
  spendSavings,
  depositSavings,
  getSavingsHistory,
};
