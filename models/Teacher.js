const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subjects: [{
    type: String,
    enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science'],
    required: true
  }],
  qualifications: {
    type: String,
    required: true,
    trim: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Teacher', teacherSchema);
