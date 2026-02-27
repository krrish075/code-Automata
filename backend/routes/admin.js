const express = require('express');
const router = express.Router();
const { adminLogin, getStudents, getStudentById, getAnalytics } = require('../controllers/adminController');

// Bypass the normal user auth for admin routes, but protect them with a demo check
const adminAuth = (req, res, next) => {
    // For a real app, verify the token. 
    // Here we will check if the authorization header simply exists for demo purposes
    // since the prompt specified "admin/admin@admin" and "no JWT required".
    const token = req.header('Authorization');
    if (!token && req.path !== '/login') {
        return res.status(401).json({ success: false, message: 'Admin Access Denied' });
    }
    next();
};

router.post('/login', adminLogin);
router.get('/students', adminAuth, getStudents);
router.get('/student/:id', adminAuth, getStudentById);
router.get('/analytics', adminAuth, getAnalytics);

module.exports = router;
