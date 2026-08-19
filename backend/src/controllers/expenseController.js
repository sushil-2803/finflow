const Expense = require('../models/Expense');
const MonthlyBudget = require('../models/MonthlyBudget');
const ExpenseGroup = require('../models/ExpenseGroup');
const User = require('../models/User');
const SavingsTransaction = require('../models/SavingsTransaction');

// @desc    Create a new expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  const {
    title,
    amount,
    paymentMethod,
    seller,
    notes,
    expenseDate,
    budgetId,
    groupId,
    isSpentFromSavings,
  } = req.body;

  const expenseAmount = parseFloat(amount);
  const spentFromSavings = isSpentFromSavings === true || isSpentFromSavings === 'true';

  try {
    let budget = null;
    let group = null;
    let user = null;
    let savingsTx = null;

    // 1. If spent from savings, deduct from user's overallSavings
    if (spentFromSavings) {
      user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (user.overallSavings < expenseAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient savings. You have ₹${user.overallSavings.toLocaleString('en-IN')} but tried to spend ₹${expenseAmount.toLocaleString('en-IN')}.`,
        });
      }

      // Deduct from savings and log savings transaction
      user.overallSavings -= expenseAmount;
      await user.save();

      savingsTx = new SavingsTransaction({
        userId: req.user.id,
        title: `Expense: ${title}`,
        amount: expenseAmount,
        type: 'withdrawal',
        purpose: notes || 'Spent from Savings (via Expense Log)',
        transactionDate: expenseDate ? new Date(expenseDate) : new Date(),
      });
      await savingsTx.save();
    } else if (budgetId) {
      // If not spent from savings and budgetId is provided, validate and update budget
      budget = await MonthlyBudget.findOne({ _id: budgetId, userId: req.user.id });
      if (!budget) {
        return res.status(404).json({ success: false, message: 'Monthly budget not found' });
      }
      if (budget.isClosed) {
        return res.status(400).json({ success: false, message: 'Cannot add expense to a closed budget' });
      }
    }

    // 2. If groupId is provided, validate and update group
    if (groupId) {
      group = await ExpenseGroup.findOne({ _id: groupId, userId: req.user.id });
      if (!group) {
        return res.status(404).json({ success: false, message: 'Expense group not found' });
      }
      if (group.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Cannot add expense to a closed expense group' });
      }
    }

    // 3. Create expense
    const expense = new Expense({
      userId: req.user.id,
      budgetId: spentFromSavings ? null : (budgetId || null),
      groupId: groupId || null,
      isSpentFromSavings: spentFromSavings,
      savingsTransactionId: savingsTx ? savingsTx._id : null,
      title,
      amount: expenseAmount,
      paymentMethod,
      seller,
      notes,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
    });

    await expense.save();

    // 4. Update budget counters (only if not spent from savings)
    if (budget && !spentFromSavings) {
      budget.totalExpenses += expenseAmount;
      budget.remainingAmount -= expenseAmount;
      await budget.save();
    }

    // 5. Update group counters (regardless of source)
    if (group) {
      group.totalSpent += expenseAmount;
      await group.save();
    }

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expenses with pagination, search, and filters
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  try {
    const query = { userId: req.user.id };

    // Apply filters if provided
    if (req.query.budgetId) {
      query.budgetId = req.query.budgetId;
    }
    if (req.query.groupId) {
      query.groupId = req.query.groupId;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { seller: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('budgetId', 'title month year')
      .populate('groupId', 'title');

    res.status(200).json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a single expense
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id })
      .populate('budgetId', 'title month year')
      .populate('groupId', 'title');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  const {
    title,
    amount,
    paymentMethod,
    seller,
    notes,
    expenseDate,
    budgetId,
    groupId,
    isSpentFromSavings,
  } = req.body;

  try {
    let expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const oldAmount = expense.amount;
    const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;

    const oldIsSpent = expense.isSpentFromSavings || false;
    const newIsSpent = isSpentFromSavings !== undefined ? (isSpentFromSavings === true || isSpentFromSavings === 'true') : oldIsSpent;

    const oldBudgetId = expense.budgetId ? expense.budgetId.toString() : null;
    const newBudgetId = budgetId !== undefined ? (budgetId || null) : oldBudgetId;

    const oldGroupId = expense.groupId ? expense.groupId.toString() : null;
    const newGroupId = groupId !== undefined ? (groupId || null) : oldGroupId;

    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Handle Savings & Budget Transitions
    if (oldIsSpent === newIsSpent) {
      // 1. Remain Spent from Savings
      if (newIsSpent) {
        const diff = newAmount - oldAmount;
        if (diff !== 0) {
          if (user.overallSavings < diff) {
            return res.status(400).json({
              success: false,
              message: `Insufficient savings. You have ₹${user.overallSavings.toLocaleString('en-IN')} but need to spend an extra ₹${diff.toLocaleString('en-IN')}.`,
            });
          }
          user.overallSavings -= diff;
          await user.save();

          // Update associated SavingsTransaction
          if (expense.savingsTransactionId) {
            await SavingsTransaction.updateOne(
              { _id: expense.savingsTransactionId },
              {
                $set: {
                  amount: newAmount,
                  title: `Expense: ${title || expense.title}`,
                  purpose: notes !== undefined ? notes : expense.notes,
                  transactionDate: expenseDate ? new Date(expenseDate) : expense.expenseDate,
                }
              }
            );
          }
        } else {
          // Sync SavingsTransaction properties if amount didn't change
          if (expense.savingsTransactionId) {
            await SavingsTransaction.updateOne(
              { _id: expense.savingsTransactionId },
              {
                $set: {
                  title: `Expense: ${title || expense.title}`,
                  purpose: notes !== undefined ? notes : expense.notes,
                  transactionDate: expenseDate ? new Date(expenseDate) : expense.expenseDate,
                }
              }
            );
          }
        }
      } else {
        // Remain Not Spent from Savings: standard budget handling
        if (oldBudgetId === newBudgetId) {
          if (newBudgetId && oldAmount !== newAmount) {
            const budget = await MonthlyBudget.findOne({ _id: newBudgetId, userId: req.user.id });
            if (budget) {
              if (budget.isClosed) {
                return res.status(400).json({ success: false, message: 'Cannot modify expenses linked to a closed budget' });
              }
              const diff = newAmount - oldAmount;
              budget.totalExpenses += diff;
              budget.remainingAmount -= diff;
              await budget.save();
            }
          }
        } else {
          // Budget has changed
          if (oldBudgetId) {
            const oldBudget = await MonthlyBudget.findOne({ _id: oldBudgetId, userId: req.user.id });
            if (oldBudget) {
              if (oldBudget.isClosed) {
                return res.status(400).json({ success: false, message: 'Cannot move expense from a closed budget' });
              }
              oldBudget.totalExpenses -= oldAmount;
              oldBudget.remainingAmount += oldAmount;
              await oldBudget.save();
            }
          }

          if (newBudgetId) {
            const newBudget = await MonthlyBudget.findOne({ _id: newBudgetId, userId: req.user.id });
            if (!newBudget) {
              return res.status(404).json({ success: false, message: 'New monthly budget not found' });
            }
            if (newBudget.isClosed) {
              return res.status(400).json({ success: false, message: 'Cannot move expense to a closed budget' });
            }
            newBudget.totalExpenses += newAmount;
            newBudget.remainingAmount -= newAmount;
            await newBudget.save();
          }
        }
      }
    } else {
      // Transitions between Savings and Budget
      if (!oldIsSpent && newIsSpent) {
        // Transition: Budget -> Savings
        if (oldBudgetId) {
          const oldBudget = await MonthlyBudget.findOne({ _id: oldBudgetId, userId: req.user.id });
          if (oldBudget) {
            if (oldBudget.isClosed) {
              return res.status(400).json({ success: false, message: 'Cannot move expense from a closed budget' });
            }
            oldBudget.totalExpenses -= oldAmount;
            oldBudget.remainingAmount += oldAmount;
            await oldBudget.save();
          }
        }

        if (user.overallSavings < newAmount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient savings. You have ₹${user.overallSavings.toLocaleString('en-IN')} but need ₹${newAmount.toLocaleString('en-IN')}.`,
          });
        }
        user.overallSavings -= newAmount;
        await user.save();

        const savingsTx = new SavingsTransaction({
          userId: req.user.id,
          title: `Expense: ${title || expense.title}`,
          amount: newAmount,
          type: 'withdrawal',
          purpose: notes !== undefined ? notes : expense.notes || 'Spent from Savings (via Expense Log)',
          transactionDate: expenseDate ? new Date(expenseDate) : expense.expenseDate,
        });
        await savingsTx.save();
        expense.savingsTransactionId = savingsTx._id;
      } else {
        // Transition: Savings -> Budget
        user.overallSavings += oldAmount;
        await user.save();

        if (expense.savingsTransactionId) {
          await SavingsTransaction.deleteOne({ _id: expense.savingsTransactionId });
          expense.savingsTransactionId = null;
        }

        if (newBudgetId) {
          const newBudget = await MonthlyBudget.findOne({ _id: newBudgetId, userId: req.user.id });
          if (!newBudget) {
            return res.status(404).json({ success: false, message: 'New monthly budget not found' });
          }
          if (newBudget.isClosed) {
            return res.status(400).json({ success: false, message: 'Cannot move expense to a closed budget' });
          }
          newBudget.totalExpenses += newAmount;
          newBudget.remainingAmount -= newAmount;
          await newBudget.save();
        }
      }
    }

    // Handle Group Changes
    if (oldGroupId === newGroupId) {
      if (newGroupId && oldAmount !== newAmount) {
        const group = await ExpenseGroup.findOne({ _id: newGroupId, userId: req.user.id });
        if (group) {
          const diff = newAmount - oldAmount;
          group.totalSpent += diff;
          await group.save();
        }
      }
    } else {
      if (oldGroupId) {
        const oldGroup = await ExpenseGroup.findOne({ _id: oldGroupId, userId: req.user.id });
        if (oldGroup) {
          oldGroup.totalSpent -= oldAmount;
          await oldGroup.save();
        }
      }

      if (newGroupId) {
        const newGroup = await ExpenseGroup.findOne({ _id: newGroupId, userId: req.user.id });
        if (!newGroup) {
          return res.status(404).json({ success: false, message: 'New expense group not found' });
        }
        if (newGroup.status !== 'active') {
          return res.status(400).json({ success: false, message: 'Cannot move expense to a closed expense group' });
        }
        newGroup.totalSpent += newAmount;
        await newGroup.save();
      }
    }

    // Update expense model
    expense.title = title || expense.title;
    expense.amount = newAmount;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.seller = seller !== undefined ? seller : expense.seller;
    expense.notes = notes !== undefined ? notes : expense.notes;
    expense.expenseDate = expenseDate ? new Date(expenseDate) : expense.expenseDate;
    expense.isSpentFromSavings = newIsSpent;
    expense.budgetId = newIsSpent ? null : newBudgetId;
    expense.groupId = newGroupId;

    await expense.save();

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    // 1. If spent from savings, return money to savings and delete savings transaction
    if (expense.isSpentFromSavings) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.overallSavings += expense.amount;
        await user.save();
      }

      if (expense.savingsTransactionId) {
        await SavingsTransaction.deleteOne({ _id: expense.savingsTransactionId });
      }
    } else if (expense.budgetId) {
      // Revert budget counters (only if NOT spent from savings)
      const budget = await MonthlyBudget.findOne({ _id: expense.budgetId, userId: req.user.id });
      if (budget) {
        if (budget.isClosed) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete expense from a closed budget',
          });
        }
        budget.totalExpenses -= expense.amount;
        budget.remainingAmount += expense.amount;
        await budget.save();
      }
    }

    // 2. Revert group counters (regardless of source)
    if (expense.groupId) {
      const group = await ExpenseGroup.findOne({ _id: expense.groupId, userId: req.user.id });
      if (group) {
        group.totalSpent -= expense.amount;
        await group.save();
      }
    }

    // 3. Delete from DB
    await Expense.deleteOne({ _id: expense._id });

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
};
