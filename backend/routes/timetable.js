const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const {
    addSubject,
    getSubjects,
    generateTimetable,
    rescheduleTimetable,
    getTimetable
} = require('../controllers/timetableController');

// All timetable routes should be protected
router.use(authMiddleware);

// Subject CRUD
router.post('/subjects', addSubject);
router.get('/subjects', getSubjects);

// Timetable Generation & Retrieval
router.post('/generate-timetable', generateTimetable);
router.post('/reschedule', rescheduleTimetable);
router.get('/', getTimetable);

module.exports = router;
