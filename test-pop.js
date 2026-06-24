const mongoose = require('mongoose');
require('dotenv').config();
const Test = require('./models/Test');
const User = require('./models/User');
const Batch = require('./models/Batch');
const Student = require('./models/Student');

const run = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/iqra-academy';
    await mongoose.connect(MONGO_URI);
    
    // Find a teacher user
    const teacherUser = await User.findOne({ role: 'teacher' });
    console.log('Teacher email:', teacherUser.email);

    const tests = await Test.find({ createdBy: teacherUser._id }).populate({
      path: 'batch',
      populate: {
        path: 'students',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    });

    console.log('\nNumber of tests found:', tests.length);
    if (tests.length > 0) {
      const firstTest = tests[0];
      console.log('Test Name:', firstTest.name);
      console.log('Batch Name:', firstTest.batch?.name);
      console.log('Students count in batch:', firstTest.batch?.students?.length);
      if (firstTest.batch?.students?.length > 0) {
        console.log('First student details:', JSON.stringify(firstTest.batch.students[0], null, 2));
      }
    }

    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
};

run();
