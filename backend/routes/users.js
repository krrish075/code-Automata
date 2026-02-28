const express = require('express');
const router = express.Router();
const User = require('../models/User');
const StudySession = require('../models/StudySession');
const auth = require('../middleware/auth');

// Get me
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update me
router.put('/me', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        Object.assign(user, req.body);
        const updatedUser = await user.save();

        // Return without password
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.json(userResponse);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Log Study Session
router.post('/study-session', auth, async (req, res) => {
    try {
        const { subject, duration, focusScore } = req.body;

        // duration is expected in minutes from frontend? Standardize to hours based on plan
        const durationHours = duration / 60;

        const session = new StudySession({
            studentId: req.user.id,
            subject: subject || 'General Study',
            duration: durationHours,
            focusScore: focusScore || 0,
            status: 'Completed'
        });

        await session.save();
        res.status(201).json(session);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Study Sessions
router.get('/study-session', auth, async (req, res) => {
    try {
        const sessions = await StudySession.find({ studentId: req.user.id }).sort({ date: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
