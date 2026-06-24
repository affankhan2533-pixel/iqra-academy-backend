const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Note = require('../models/Note');
const Assignment = require('../models/Assignment');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const Batch = require('../models/Batch');
const { protect, authorize } = require('../middleware/auth');
const aiService = require('../utils/aiService');

router.use(protect);
router.use(authorize('parent'));

// Helper to get student linked to this parent user
const getLinkedStudent = async (parentUserId) => {
  const student = await Student.findOne({ parentUser: parentUserId }).populate('batch').populate('user', '-password');
  if (!student) {
    throw new Error('No linked student profile found for this parent user account.');
  }
  return student;
};

/**
 * @desc    Get Parent Dashboard details
 * @route   GET /api/parent/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const student = await getLinkedStudent(req.user._id);

    // Calculate attendance percentage
    const totalDays = await Attendance.countDocuments({ student: student._id });
    const presentDays = await Attendance.countDocuments({ student: student._id, status: { $in: ['Present', 'Late'] } });
    const attendancePct = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 100;

    // Attendance logs
    const attendanceLogs = await Attendance.find({ student: student._id }).sort({ date: -1 }).limit(10);

    // Recent results
    const recentResults = await Result.find({ student: student._id })
      .populate('test')
      .sort({ createdAt: -1 })
      .limit(5);

    // Assignments
    let homework = [];
    if (student.batch) {
      homework = await Assignment.find({ batch: student.batch._id })
        .populate('uploadedBy', 'name')
        .sort({ dueDate: 1 });
    }

    // Announcements
    const announcements = await Announcement.find({ targetRole: 'student' })
      .populate('postedBy', 'name')
      .sort({ date: -1 })
      .limit(5);

    // Fee records
    const fees = await Fee.find({ student: student._id }).sort({ dueDate: -1 });

    // AI performance analysis recommendation
    const aiAnalysis = await aiService.analyzePerformance(student._id);

    res.json({
      student,
      attendancePct,
      attendanceLogs,
      recentResults,
      homework,
      announcements,
      fees,
      aiAnalysis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @desc    Get detailed report for monthly PDF download
 * @route   GET /api/parent/report
 */
router.get('/report', async (req, res) => {
  try {
    const student = await getLinkedStudent(req.user._id);

    // Aggregate attendance
    const attendanceLogs = await Attendance.find({ student: student._id });
    const totalDays = attendanceLogs.length;
    const presentDays = attendanceLogs.filter(l => l.status === 'Present').length;
    const absentDays = attendanceLogs.filter(l => l.status === 'Absent').length;
    const lateDays = attendanceLogs.filter(l => l.status === 'Late').length;
    const attendancePct = totalDays > 0 ? Number((((presentDays + lateDays) / totalDays) * 100).toFixed(2)) : 100;

    // Get all results
    const results = await Result.find({ student: student._id })
      .populate('test')
      .sort({ createdAt: -1 });

    // Get fees
    const fees = await Fee.find({ student: student._id });

    // AI Analysis
    const aiAnalysis = await aiService.analyzePerformance(student._id);

    res.json({
      student,
      attendance: {
        attendancePct,
        totalDays,
        presentDays,
        absentDays,
        lateDays
      },
      results,
      fees,
      aiAnalysis
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
