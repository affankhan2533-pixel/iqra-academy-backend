const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const Attendance = require('../models/Attendance');
const Test = require('../models/Test');
const Result = require('../models/Result');
const Assignment = require('../models/Assignment');
const Note = require('../models/Note');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('teacher'));

// Helper helper to get teacher profile ID
const getTeacherProfile = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId });
  if (!teacher) throw new Error('Teacher profile not found');
  return teacher;
};

// @desc    Get teacher's assigned batches
// @route   GET /api/teacher/batches
router.get('/batches', async (req, res) => {
  try {
    const teacher = await getTeacherProfile(req.user._id);
    const batches = await Batch.find({ teachers: teacher._id })
      .populate('course')
      .populate({
        path: 'students',
        populate: { path: 'user', select: 'name email' }
      });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark attendance for a batch
// @route   POST /api/teacher/attendance
router.post('/attendance', async (req, res) => {
  const { batchId, date, attendanceRecords } = req.body; // attendanceRecords: [{ studentId, status: 'Present'/'Absent'/'Late' }]

  try {
    if (!batchId || !date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: 'Invalid attendance submission data' });
    }

    const attendanceDocs = [];
    for (const record of attendanceRecords) {
      // Upsert attendance for the student on this date
      const query = {
        student: record.studentId,
        batch: batchId,
        date: new Date(date)
      };
      const update = {
        status: record.status,
        markedBy: req.user._id
      };
      const doc = await Attendance.findOneAndUpdate(query, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      });
      attendanceDocs.push(doc);
    }

    res.status(200).json({ message: 'Attendance marked successfully', data: attendanceDocs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get attendance history for a batch
// @route   GET /api/teacher/attendance/:batchId
router.get('/attendance/:batchId', async (req, res) => {
  try {
    const attendance = await Attendance.find({ batch: req.params.batchId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ date: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a monthly test
// @route   POST /api/teacher/tests
router.post('/tests', async (req, res) => {
  const { name, subject, class: testClass, batchId, date, maxMarks } = req.body;

  try {
    const test = await Test.create({
      name,
      subject,
      class: testClass,
      batch: batchId,
      date: new Date(date),
      maxMarks,
      createdBy: req.user._id
    });

    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get tests created by teacher
// @route   GET /api/teacher/tests
router.get('/tests', async (req, res) => {
  try {
    const tests = await Test.find({ createdBy: req.user._id }).populate({
      path: 'batch',
      populate: {
        path: 'students',
        populate: {
          path: 'user',
          select: 'name email'
        }
      }
    });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload marks for a test and calculate grades/ranks
// @route   POST /api/teacher/results
router.post('/results', async (req, res) => {
  const { testId, marksRecords } = req.body; // marksRecords: [{ studentId, obtainedMarks, remarks }]

  try {
    if (!marksRecords || !Array.isArray(marksRecords)) {
      return res.status(400).json({ message: 'Marks records must be provided as an array' });
    }

    for (const record of marksRecords) {
      if (!record.studentId || !mongoose.Types.ObjectId.isValid(record.studentId)) {
        return res.status(400).json({ message: `Invalid or missing student ID: ${record.studentId}` });
      }
    }

    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    const results = [];

    // Calculate percentage and grade
    const getGrade = (pct) => {
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B+';
      if (pct >= 60) return 'B';
      if (pct >= 50) return 'C';
      if (pct >= 40) return 'D';
      return 'F';
    };

    // 1. Save all results first
    for (const record of marksRecords) {
      const pct = Number(((record.obtainedMarks / test.maxMarks) * 100).toFixed(2));
      const grade = getGrade(pct);

      const query = { student: record.studentId, test: testId };
      const update = {
        obtainedMarks: record.obtainedMarks,
        percentage: pct,
        grade,
        remarks: record.remarks || ''
      };

      const result = await Result.findOneAndUpdate(query, update, {
        upsert: true,
        new: true
      });
      results.push(result);

      // Create in-app notification for student
      const studentProfile = await Student.findById(record.studentId);
      if (studentProfile) {
        await Notification.create({
          user: studentProfile.user,
          message: `Your result for '${test.name}' (${test.subject}) is out: ${record.obtainedMarks}/${test.maxMarks} (${pct}%, Grade ${grade})`,
          type: 'Success'
        });
      }
    }

    // 2. Rank calculation for this test
    const allResults = await Result.find({ test: testId }).sort({ obtainedMarks: -1 });
    for (let i = 0; i < allResults.length; i++) {
      allResults[i].rank = i + 1;
      await allResults[i].save();
    }

    // Fetch updated results with student information to return
    const updatedResults = await Result.find({ test: testId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ rank: 1 });

    res.status(200).json(updatedResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get results for a specific test
// @route   GET /api/teacher/results/:testId
router.get('/results/:testId', async (req, res) => {
  try {
    const results = await Result.find({ test: req.params.testId })
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ rank: 1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload assignments/homework
// @route   POST /api/teacher/assignments
router.post('/assignments', async (req, res) => {
  const { title, description, batchId, dueDate } = req.body;

  try {
    const assignment = await Assignment.create({
      title,
      description,
      batch: batchId,
      dueDate: new Date(dueDate),
      uploadedBy: req.user._id
    });

    // Notify students of the batch
    const batch = await Batch.findById(batchId);
    if (batch) {
      const students = await Student.find({ _id: { $in: batch.students } });
      const notifications = students.map(student => ({
        user: student.user,
        message: `New Assignment: '${title}' due on ${new Date(dueDate).toLocaleDateString()}`,
        type: 'Alert'
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload Notes / Study Materials
// @route   POST /api/teacher/notes
router.post('/notes', async (req, res) => {
  const { title, subject, class: noteClass, fileUrl, description } = req.body;

  try {
    const note = await Note.create({
      title,
      subject,
      class: noteClass,
      fileUrl,
      description,
      uploadedBy: req.user._id
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all notes uploaded by teacher
// @route   GET /api/teacher/notes
router.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.user._id });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
