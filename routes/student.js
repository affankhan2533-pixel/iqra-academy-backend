const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');
const Fee = require('../models/Fee');
const Note = require('../models/Note');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const Announcement = require('../models/Announcement');
const Batch = require('../models/Batch');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('student'));

// Helper to get student profile
const getStudentProfile = async (userId) => {
  const student = await Student.findOne({ user: userId }).populate('batch');
  if (!student) throw new Error('Student profile not found');
  return student;
};

// @desc    Get Student Dashboard Info
// @route   GET /api/student/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const student = await getStudentProfile(req.user._id);

    // Calculate attendance percentage
    const totalDays = await Attendance.countDocuments({ student: student._id });
    const presentDays = await Attendance.countDocuments({ student: student._id, status: { $in: ['Present', 'Late'] } });
    const attendancePct = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 100;

    // Recent results
    const recentResults = await Result.find({ student: student._id })
      .populate('test')
      .sort({ createdAt: -1 })
      .limit(5);

    // Homework/assignments (matching batch)
    let homework = [];
    if (student.batch) {
      homework = await Assignment.find({ batch: student.batch._id })
        .populate('uploadedBy', 'name')
        .sort({ dueDate: 1 });
    }

    // Study materials (matching student's class)
    const notes = await Note.find({ class: student.class })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Announcements targeting 'student' role
    const announcements = await Announcement.find({ targetRole: 'student' })
      .populate('postedBy', 'name')
      .sort({ date: -1 })
      .limit(5);

    // Unread notifications
    const unreadNotifications = await Notification.find({ user: req.user._id, isRead: false })
      .sort({ createdAt: -1 });

    res.json({
      student,
      attendancePct,
      recentResults,
      homework,
      notes,
      announcements,
      unreadNotifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get detailed attendance history
// @route   GET /api/student/attendance
router.get('/attendance', async (req, res) => {
  try {
    const student = await getStudentProfile(req.user._id);
    const logs = await Attendance.find({ student: student._id }).sort({ date: -1 });

    const totalDays = logs.length;
    const presentDays = logs.filter(l => l.status === 'Present').length;
    const absentDays = logs.filter(l => l.status === 'Absent').length;
    const lateDays = logs.filter(l => l.status === 'Late').length;

    res.json({
      attendancePct: totalDays > 0 ? Number((((presentDays + lateDays) / totalDays) * 100).toFixed(2)) : 100,
      stats: {
        totalDays,
        presentDays,
        absentDays,
        lateDays
      },
      logs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all test results
// @route   GET /api/student/results
router.get('/results', async (req, res) => {
  try {
    const student = await getStudentProfile(req.user._id);
    const results = await Result.find({ student: student._id })
      .populate({
        path: 'test',
        populate: { path: 'createdBy', select: 'name' }
      })
      .sort({ createdAt: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get fee payments status
// @route   GET /api/student/fees
router.get('/fees', async (req, res) => {
  try {
    const student = await getStudentProfile(req.user._id);
    const fees = await Fee.find({ student: student._id }).sort({ dueDate: -1 });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get study materials (notes)
// @route   GET /api/student/notes
router.get('/notes', async (req, res) => {
  try {
    const student = await getStudentProfile(req.user._id);
    const notes = await Note.find({ class: student.class })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get notifications
// @route   GET /api/student/notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark single notification as read
// @route   PUT /api/student/notifications/:id
router.put('/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/student/notifications/read-all
router.put('/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
