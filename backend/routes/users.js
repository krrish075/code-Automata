const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get me
router.get('/me', async (req, res) => {
    try {
        let user = await User.findOne();
        if (!user) {
            user = new User({
                xp: 2450,
                level: 12,
                streak: 7,
                totalStudyMinutes: 1240,
                focusHours: 18.5,
                tasksCompleted: 34,
                totalTasks: 42,
                isDark: false
            });
            await user.save();
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update me
router.put('/me', async (req, res) => {
    try {
        // Find the single user
        let user = await User.findOne();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        Object.assign(user, req.body);
        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
