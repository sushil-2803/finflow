const mongoose = require('mongoose');

const ExpenseGroupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  budgetLimit: {
    type: Number,
    default: null,
    min: 0,
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0,
  },
  isBudgetEnabled: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'archived'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

ExpenseGroupSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ExpenseGroup', ExpenseGroupSchema);
