const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'iqra_academy_super_secret_key_12345!', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user (with profile setup)
// @route   POST /api/auth/register
// @access  Public (for initial setup/admin)
router.post('/register', async (req, res) => {
  const { name, email, password, role, profileData } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    if (role === 'student') {
      const { rollNo, class: studentClass, parentName, parentContact, address } = profileData || {};
      await Student.create({
        user: user._id,
        rollNo: rollNo || `ROLL-${Date.now().toString().slice(-6)}`,
        class: studentClass || 'SSC',
        parentName: parentName || 'N/A',
        parentContact: parentContact || 'N/A',
        address: address || 'Dharavi, Mumbai',
        feeStatus: 'Pending'
      });
    } else if (role === 'teacher') {
      const { subjects, qualifications } = profileData || {};
      await Teacher.create({
        user: user._id,
        subjects: subjects || ['Mathematics'],
        qualifications: qualifications || 'Graduate'
      });
    } else if (role === 'parent') {
      const { studentRollNo } = profileData || {};
      if (studentRollNo) {
        const linkedStudent = await Student.findOne({ rollNo: studentRollNo });
        if (linkedStudent) {
          linkedStudent.parentUser = user._id;
          await linkedStudent.save();
        } else {
          await User.findByIdAndDelete(user._id);
          return res.status(400).json({ message: `Student Roll Number '${studentRollNo}' not found. Parent registration failed.` });
        }
      } else {
        await User.findByIdAndDelete(user._id);
        return res.status(400).json({ message: 'Student Roll Number is required for parent registration.' });
      }
    }

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let details = {};
    if (user.role === 'student') {
      details = await Student.findOne({ user: user._id }).populate('batch');
    } else if (user.role === 'teacher') {
      details = await Teacher.findOne({ user: user._id });
    } else if (user.role === 'parent') {
      details = await Student.findOne({ parentUser: user._id }).populate('batch');
    }

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        details
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    let details = {};
    if (req.user.role === 'student') {
      details = await Student.findOne({ user: req.user._id }).populate('batch');
    } else if (req.user.role === 'teacher') {
      details = await Teacher.findOne({ user: req.user._id });
    } else if (req.user.role === 'parent') {
      details = await Student.findOne({ parentUser: req.user._id }).populate('batch');
    }

    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar,
      details
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
