const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const { sendInquiryEmail, sendConfirmationEmail } = require('../utils/mailer');

// @desc    Submit a contact inquiry
// @route   POST /api/contact
// @access  Public
router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;

  // Basic validation
  if (!name || !phone || !message) {
    return res.status(400).json({ message: 'Name, Phone, and Message are required' });
  }

  try {
    // Save to MongoDB
    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      message
    });

    // Send emails asynchronously (failures won't block the API response)
    sendInquiryEmail(inquiry);
    if (email) {
      sendConfirmationEmail(inquiry);
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: inquiry
    });
  } catch (error) {
    console.error('Error in contact submission route:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
});

module.exports = router;
