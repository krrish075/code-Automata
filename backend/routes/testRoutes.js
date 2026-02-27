const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TestResult = require('../models/TestResult');

// POST /api/tests - Save a test result
router.post('/', auth, async (req, res) => {
    try {
        const { subjectName, testName, score, totalQuestions, questions, remarks } = req.body;
        const testResult = new TestResult({
            userId: req.user.id,
            subjectName,
            testName,
            score,
            totalQuestions,
            remarks: remarks || 'Completed normally',
            questions
        });

        await testResult.save();
        res.status(201).json(testResult);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET /api/tests - Fetch all test results for logged-in user
router.get('/', auth, async (req, res) => {
    try {
        const testResults = await TestResult.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(testResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
