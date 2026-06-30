const ExpenseGroup = require('../models/ExpenseGroup');
const Expense = require('../models/Expense');

// @desc    Create a new expense group
// @route   POST /api/groups
// @access  Private
const createGroup = async (req, res, next) => {
  const {
    title,
    description,
    startDate,
    endDate,
    budgetLimit,
    isBudgetEnabled,
    status,
  } = req.body;

  try {
    const group = new ExpenseGroup({
      userId: req.user.id,
      title,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      budgetLimit: budgetLimit !== undefined && budgetLimit !== null ? parseFloat(budgetLimit) : null,
      isBudgetEnabled: isBudgetEnabled !== undefined ? isBudgetEnabled : true,
      status: status || 'active',
      totalSpent: 0,
    });

    await group.save();

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all expense groups for user
// @route   GET /api/groups
// @access  Private
const getGroups = async (req, res, next) => {
  try {
    const groups = await ExpenseGroup.find({ userId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: groups.length,
      data: groups,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single expense group and its associated expenses
// @route   GET /api/groups/:id
// @access  Private
const getGroupById = async (req, res, next) => {
  try {
    const group = await ExpenseGroup.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Expense group not found',
      });
    }

    // Fetch all expenses associated with this group
    const expenses = await Expense.find({ groupId: group._id }).sort({ expenseDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        group,
        expenses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense group
// @route   PUT /api/groups/:id
// @access  Private
const updateGroup = async (req, res, next) => {
  const {
    title,
    description,
    startDate,
    endDate,
    budgetLimit,
    isBudgetEnabled,
    status,
  } = req.body;

  try {
    let group = await ExpenseGroup.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Expense group not found',
      });
    }

    if (title) group.title = title;
    if (description !== undefined) group.description = description;
    if (startDate) group.startDate = new Date(startDate);
    if (endDate !== undefined) group.endDate = endDate ? new Date(endDate) : null;
    if (budgetLimit !== undefined) group.budgetLimit = budgetLimit !== null ? parseFloat(budgetLimit) : null;
    if (isBudgetEnabled !== undefined) group.isBudgetEnabled = isBudgetEnabled;
    if (status) group.status = status;

    await group.save();

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense group
// @route   DELETE /api/groups/:id
// @access  Private
const deleteGroup = async (req, res, next) => {
  try {
    const group = await ExpenseGroup.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Expense group not found',
      });
    }

    // Disassociate all expenses linked to this group
    await Expense.updateMany({ groupId: group._id }, { $set: { groupId: null } });

    // Delete the group itself
    await ExpenseGroup.deleteOne({ _id: group._id });

    res.status(200).json({
      success: true,
      message: 'Expense group deleted successfully (linked expenses disassociated)',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
};
