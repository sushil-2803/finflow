const MonthlyBudget = require('../models/MonthlyBudget');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @desc    Create a new monthly budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res, next) => {
  const { title, month, year, startDate, endDate, budgetAmount } = req.body;

  try {
    // Check if budget for the same month/year already exists
    const existingBudget = await MonthlyBudget.findOne({
      userId: req.user.id,
      month: parseInt(month),
      year: parseInt(year),
    });

    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `A budget already exists for ${month}/${year}`,
      });
    }

    const budget = new MonthlyBudget({
      userId: req.user.id,
      title,
      month: parseInt(month),
      year: parseInt(year),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budgetAmount: parseFloat(budgetAmount),
      remainingAmount: parseFloat(budgetAmount), // Initially, remaining equals budget
      totalExpenses: 0,
      savingsGenerated: 0,
      isClosed: false,
    });

    await budget.save();

    res.status(201).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all budgets for user
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res, next) => {
  try {
    const budgets = await MonthlyBudget.find({ userId: req.user.id }).sort({ year: -1, month: -1 });

    res.status(200).json({
      success: true,
      count: budgets.length,
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single budget details
// @route   GET /api/budgets/:id
// @access  Private
const getBudgetById = async (req, res, next) => {
  try {
    const budget = await MonthlyBudget.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res, next) => {
  const { title, budgetAmount, endDate, startDate } = req.body;

  try {
    let budget = await MonthlyBudget.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    if (budget.isClosed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a closed budget',
      });
    }

    if (title) budget.title = title;
    if (startDate) budget.startDate = new Date(startDate);
    if (endDate) budget.endDate = new Date(endDate);

    if (budgetAmount !== undefined) {
      const newBudgetAmount = parseFloat(budgetAmount);
      // Recalculate remaining amount based on new budget amount and current total expenses
      const newRemainingAmount = newBudgetAmount - budget.totalExpenses;

      if (newRemainingAmount < 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce budget limit below current total expenses (₹${budget.totalExpenses})`,
        });
      }

      budget.budgetAmount = newBudgetAmount;
      budget.remainingAmount = newRemainingAmount;
    }

    await budget.save();

    res.status(200).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await MonthlyBudget.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    // Delete all expenses associated with this budget
    await Expense.deleteMany({ budgetId: budget._id });

    // Delete the budget
    await MonthlyBudget.deleteOne({ _id: budget._id });

    res.status(200).json({
      success: true,
      message: 'Budget and associated expenses deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Close budget and transfer remaining balance to overall savings (Option B)
// @route   POST /api/budgets/:id/close
// @access  Private
const closeBudget = async (req, res, next) => {
  try {
    const budget = await MonthlyBudget.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    if (budget.isClosed) {
      return res.status(400).json({
        success: false,
        message: 'Budget is already closed',
      });
    }

    // Savings generated is the remaining budget amount
    const savings = budget.remainingAmount;

    // Update budget state
    budget.isClosed = true;
    budget.savingsGenerated = savings;
    // Set remaining amount to 0 since it has been transferred
    budget.remainingAmount = 0;

    await budget.save();

    // Update User overallSavings
    const user = await User.findById(req.user.id);
    if (user) {
      user.overallSavings += savings;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Budget closed and remaining balance transferred to savings successfully',
      data: {
        budget,
        overallSavings: user ? user.overallSavings : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
  closeBudget,
};
