const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MonthlyBudget',
    default: null,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpenseGroup',
    default: null,
  },
  isSpentFromSavings: {
    type: Boolean,
    default: false,
  },
  savingsTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SavingsTransaction',
    default: null,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    trim: true,
    default: '',
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'],
  },
  seller: {
    type: String,
    trim: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  expenseDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for search and queries
ExpenseSchema.index({ userId: 1, expenseDate: -1 });
ExpenseSchema.index({ budgetId: 1 });
ExpenseSchema.index({ groupId: 1 });
ExpenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);
