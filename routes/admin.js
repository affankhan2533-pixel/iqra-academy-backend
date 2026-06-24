const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Batch = require('../models/Batch');
const Fee = require('../models/Fee');
const Test = require('../models/Test');
const Result = require('../models/Result');
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const { protect, authorize } = require('../middleware/auth');

// Apply auth protection & role check for all routes in this file
router.use(protect);
router.use(authorize('admin'));

// ==========================================
// 1. DASHBOARD STATS
// ==========================================
router.get('/dashboard-stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalBatches = await Batch.countDocuments();
    const totalCourses = await Course.countDocuments();

    // Fee calculations
    const feeRecords = await Fee.find({});
    let totalCollected = 0;
    let totalPending = 0;
    feeRecords.forEach(f => {
      if (f.status === 'Paid') totalCollected += f.amount;
      else totalPending += f.amount;
    });

    // Month-wise fee collection statistics (for chart)
    const monthlyFees = await Fee.aggregate([
      {
        $group: {
          _id: '$month',
          collected: {
            $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] }
          },
          pending: {
            $sum: { $cond: [{ $ne: ['$status', 'Paid'] }, '$amount', 0] }
          }
        }
      }
    ]);

    // Student enrollment per class
    const sscCount = await Student.countDocuments({ class: 'SSC' });
    const xiCount = await Student.countDocuments({ class: 'XI Science' });
    const xiiCount = await Student.countDocuments({ class: 'XII Science' });

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalBatches,
        totalCourses,
        totalCollected,
        totalPending
      },
      classCounts: {
        'SSC': sscCount,
        'XI Science': xiCount,
        'XII Science': xiiCount
      },
      monthlyFees
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 2. STUDENTS CRUD
// ==========================================
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find({})
      .populate('user', '-password')
      .populate('batch');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/students', async (req, res) => {
  const { name, email, password, rollNo, class: studentClass, batch, parentName, parentContact, address, feeStatus, totalFee, paidFee } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User email already exists' });

    const user = await User.create({
      name,
      email,
      password: password || 'iqra123', // default temp password
      role: 'student'
    });

    const student = await Student.create({
      user: user._id,
      rollNo,
      class: studentClass,
      batch: batch || null,
      parentName,
      parentContact,
      address,
      feeStatus: feeStatus || 'Pending',
      totalFee: Number(totalFee) || 0,
      paidFee: Number(paidFee) || 0
    });

    // If batch was specified, add student to batch
    if (batch) {
      await Batch.findByIdAndUpdate(batch, { $addToSet: { students: student._id } });
    }

    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/students/:id', async (req, res) => {
  const { name, email, rollNo, class: studentClass, batch, parentName, parentContact, address, feeStatus, totalFee, paidFee } = req.body;
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    await User.findByIdAndUpdate(student.user, { name, email });

    // Handle batch changing logic
    if (batch && student.batch && student.batch.toString() !== batch) {
      // remove from old batch
      await Batch.findByIdAndUpdate(student.batch, { $pull: { students: student._id } });
      // add to new batch
      await Batch.findByIdAndUpdate(batch, { $addToSet: { students: student._id } });
    } else if (batch && !student.batch) {
      await Batch.findByIdAndUpdate(batch, { $addToSet: { students: student._id } });
    }

    student.rollNo = rollNo || student.rollNo;
    student.class = studentClass || student.class;
    student.batch = batch || student.batch;
    student.parentName = parentName || student.parentName;
    student.parentContact = parentContact || student.parentContact;
    student.address = address || student.address;
    if (totalFee !== undefined) student.totalFee = Number(totalFee);
    if (paidFee !== undefined) student.paidFee = Number(paidFee);
    if (feeStatus) student.feeStatus = feeStatus;

    await student.save();
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Remove student from its batch
    if (student.batch) {
      await Batch.findByIdAndUpdate(student.batch, { $pull: { students: student._id } });
    }

    // Delete associated User account
    await User.findByIdAndDelete(student.user);
    // Delete student record
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 3. TEACHERS CRUD
// ==========================================
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find({}).populate('user', '-password');
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/teachers', async (req, res) => {
  const { name, email, password, subjects, qualifications } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User email already exists' });

    const user = await User.create({
      name,
      email,
      password: password || 'teacher123',
      role: 'teacher'
    });

    const teacher = await Teacher.create({
      user: user._id,
      subjects,
      qualifications
    });

    res.status(201).json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/teachers/:id', async (req, res) => {
  const { name, email, subjects, qualifications } = req.body;
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    await User.findByIdAndUpdate(teacher.user, { name, email });

    teacher.subjects = subjects || teacher.subjects;
    teacher.qualifications = qualifications || teacher.qualifications;

    await teacher.save();
    res.json(teacher);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    // Remove teacher ref from batches
    await Batch.updateMany({ teachers: teacher._id }, { $pull: { teachers: teacher._id } });

    await User.findByIdAndDelete(teacher.user);
    await Teacher.findByIdAndDelete(req.params.id);

    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 4. COURSES CRUD
// ==========================================
router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/courses', async (req, res) => {
  const { name, subjects, description, duration, fee } = req.body;
  try {
    const course = await Course.create({ name, subjects, description, duration, fee });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/courses/:id', async (req, res) => {
  const { name, subjects, description, duration, fee } = req.body;
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { name, subjects, description, duration, fee },
      { new: true }
    );
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 5. BATCHES CRUD
// ==========================================
router.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find({})
      .populate('course')
      .populate({
        path: 'teachers',
        populate: { path: 'user', select: 'name email' }
      })
      .populate({
        path: 'students',
        populate: { path: 'user', select: 'name email' }
      });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/batches', async (req, res) => {
  const { name, course, teachers, schedule, room } = req.body;
  try {
    const batch = await Batch.create({
      name,
      course,
      teachers: teachers || [],
      schedule,
      room
    });
    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/batches/:id', async (req, res) => {
  const { name, course, teachers, students, schedule, room } = req.body;
  try {
    const batch = await Batch.findByIdAndUpdate(
      req.params.id,
      { name, course, teachers, students, schedule, room },
      { new: true }
    );
    res.json(batch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) return res.status(404).json({ message: 'Batch not found' });

    // remove batch reference from students
    await Student.updateMany({ batch: batch._id }, { $set: { batch: null } });

    await Batch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 6. FEE MANAGEMENT
// ==========================================
router.get('/fees', async (req, res) => {
  try {
    const fees = await Fee.find({}).populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' }
    });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/fees', async (req, res) => {
  const { studentId, amount, dueDate, month } = req.body;
  try {
    const fee = await Fee.create({
      student: studentId,
      amount,
      dueDate,
      month,
      status: 'Pending'
    });
    res.status(201).json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/fees/:id', async (req, res) => {
  const { status, paidDate, receiptNo } = req.body;
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: 'Fee record not found' });

    fee.status = status || fee.status;
    if (status === 'Paid') {
      fee.paidDate = paidDate || Date.now();
      fee.receiptNo = receiptNo || `REC-${Date.now().toString().slice(-6)}`;
      
      // Update fee status on student model as well
      await Student.findByIdAndUpdate(fee.student, { feeStatus: 'Paid' });
    } else {
      await Student.findByIdAndUpdate(fee.student, { feeStatus: status });
    }

    await fee.save();
    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// 7. ANNOUNCEMENTS
// ==========================================
router.post('/announcements', async (req, res) => {
  const { title, content, targetRole } = req.body;
  try {
    const announcement = await Announcement.create({
      title,
      content,
      targetRole: targetRole || ['student', 'teacher'],
      postedBy: req.user._id
    });

    // Send notifications to all target users in DB
    const users = await User.find({ role: { $in: targetRole } });
    const notifications = users.map(user => ({
      user: user._id,
      message: `New Announcement: ${title}`,
      type: 'Info'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({}).populate('postedBy', 'name').sort({ date: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
