const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  subjects: [{
    type: String,
    required: true
  }],
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: String,
    default: '1 Year'
  },
  fee: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
