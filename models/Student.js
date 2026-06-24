const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  class: {
    type: String,
    enum: ['SSC', 'XI Science', 'XII Science'],
    required: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch'
  },
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  parentContact: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  feeStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue'],
    default: 'Pending'
  },
  totalFee: {
    type: Number,
    default: 0
  },
  paidFee: {
    type: Number,
    default: 0
  },
  remainingFee: {
    type: Number,
    default: 0
  },
  parentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

studentSchema.pre('save', function () {
  this.remainingFee = (this.totalFee || 0) - (this.paidFee || 0);
  if (this.remainingFee <= 0) {
    this.feeStatus = 'Paid';
  } else {
    this.feeStatus = 'Pending';
  }
});

module.exports = mongoose.model('Student', studentSchema);
