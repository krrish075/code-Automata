const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

const getJwtToken = (userId) => {
    return jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET || 'secret123',
        { expiresIn: '5 days' }
    );
};

// Register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const token = getJwtToken(user.id);
        const logEntry = new LoginLog({ userId: user.id });
        await logEntry.save();

        res.json({ sessionId: logEntry.id, token, role: 'student', user: { id: user.id, name: user.name, email: user.email, xp: user.xp, level: user.level, timetable: user.timetable, isDark: user.isDark } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.isGuest) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const token = getJwtToken(user.id);
        const logEntry = new LoginLog({ userId: user.id });
        await logEntry.save();

        res.json({ sessionId: logEntry.id, token, role: 'student', user: { id: user.id, name: user.name, email: user.email, xp: user.xp, level: user.level, timetable: user.timetable, isDark: user.isDark } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Guest Login
router.post('/guest', async (req, res) => {
    try {
        const user = new User({
            name: `Guest_${Math.floor(Math.random() * 10000)}`,
            isGuest: true
        });
        await user.save();

        const token = getJwtToken(user.id);
        const logEntry = new LoginLog({ userId: user.id });
        await logEntry.save();

        res.json({ sessionId: logEntry.id, token, role: 'guest', user: { id: user.id, name: user.name, isGuest: user.isGuest, xp: user.xp, level: user.level, timetable: user.timetable, isDark: user.isDark } });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout Session Tracking
router.post('/logout', async (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) return res.json({ success: true });

    try {
        const logEntry = await LoginLog.findById(sessionId);
        if (logEntry && !logEntry.logoutTime) {
            logEntry.logoutTime = new Date();
            logEntry.durationSeconds = Math.floor((logEntry.logoutTime - logEntry.loginTime) / 1000);
            await logEntry.save();
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Server error tracking logout' });
    }
});

module.exports = router;
