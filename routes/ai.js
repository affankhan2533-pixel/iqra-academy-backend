const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const aiService = require('../utils/aiService');
const Student = require('../models/Student');

// Apply protection to all AI endpoints
router.use(protect);

/**
 * @desc    AI Chat Doubts Solver / Tutor
 * @route   POST /api/ai/chat
 */
router.post('/chat', async (req, res) => {
  const { query, subject, className } = req.body;
  if (!query) {
    return res.status(400).json({ message: 'Query string is required' });
  }

  try {
    const responseText = await aiService.askAI(query, subject, className);
    res.json({ response: responseText });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @desc    AI Notes Summarizer
 * @route   POST /api/ai/summarize
 */
router.post('/summarize', async (req, res) => {
  const { fileName, textContent } = req.body;
  try {
    const summary = await aiService.summarizeNotes(fileName, textContent);
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @desc    AI Test Question Generator
 * @route   POST /api/ai/generate-test
 */
router.post('/generate-test', async (req, res) => {
  const { subject, chapter, difficulty, numQuestions, marks } = req.body;
  
  if (!subject || !chapter) {
    return res.status(400).json({ message: 'Subject and chapter are required' });
  }

  try {
    const questions = await aiService.generateTestQuestions(
      subject,
      chapter,
      difficulty || 'Medium',
      numQuestions || 5,
      marks || 25
    );
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @desc    AI Career Counselor
 * @route   POST /api/ai/career-counsel
 */
router.post('/career-counsel', async (req, res) => {
  const { favoriteSubjects, performance, interests, goals } = req.body;

  try {
    const roadmap = await aiService.generateCareerCounsel(
      favoriteSubjects,
      performance,
      interests,
      goals
    );
    res.json({ roadmap });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @desc    AI Student Performance Analysis
 * @route   GET /api/ai/performance-analysis/:studentId
 */
router.get('/performance-analysis/:studentId', async (req, res) => {
  try {
    const analysis = await aiService.analyzePerformance(req.params.studentId);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @desc    AI Daily Recommendations Engine
 * @route   GET /api/ai/recommendations/:studentId
 */
router.get('/recommendations/:studentId', async (req, res) => {
  try {
    const analysis = await aiService.analyzePerformance(req.params.studentId);
    const weakSub = analysis.weakSubjects[0] || 'Chemistry';
    const strongSub = analysis.strongSubjects[0] || 'Mathematics';

    const tasks = [
      { id: 1, title: `Revise ${weakSub} Chapter notes`, detail: 'Go through the notes uploaded by your teacher on weak chapters.', type: 'Revision', duration: '30 mins' },
      { id: 2, title: `Solve 15 MCQs on ${weakSub}`, detail: `Focus on objective questions to test basic concepts in ${weakSub}.`, type: 'Practice', duration: '45 mins' },
      { id: 3, title: `Watch recorded tutorial on ${weakSub}`, detail: 'Review video lecture or visual diagrams regarding formulas.', type: 'Lecture', duration: '20 mins' },
      { id: 4, title: `Solve a numerical problem in ${strongSub}`, detail: 'Keep your strong subjects sharp by practicing high-level problems.', type: 'Challenge', duration: '15 mins' }
    ];

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
