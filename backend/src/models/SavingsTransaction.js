const mongoose = require('mongoose');

const SavingsTransactionSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal'],
    default: 'withdrawal',
  },
  purpose: {
    type: String,
    trim: true,
  },
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

SavingsTransactionSchema.index({ userId: 1, transactionDate: -1 });

module.exports = mongoose.model('SavingsTransaction', SavingsTransactionSchema);
