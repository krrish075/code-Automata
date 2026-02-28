const User = require('../models/User');
const StudySession = require('../models/StudySession');
const TestResult = require('../models/TestResult');
const Task = require('../models/Task');
const LoginLog = require('../models/LoginLog');

// Admin Login
exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;

    // Hardcoded Demo Credentials
    if (username === 'admin' && password === 'admin@admin') {
        return res.json({
            success: true,
            role: "admin",
            token: "admin_demo_token_xyz123" // Mock token to bypass middleware if needed
        });
    }

    return res.status(401).json({ success: false, message: 'Invalid Admin Credentials' });
};

// Get All Students
exports.getStudents = async (req, res) => {
    try {
        const students = await User.find({ isGuest: false }).select('-password');

        const enhancedStudents = students.map(s => ({
            id: s._id,
            name: s.name,
            email: s.email,
            totalStudyHours: Math.floor((s.totalStudyMinutes || 0) / 60),
            joinedDate: s.createdAt
        }));

        res.json(enhancedStudents);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Single Student Detail
exports.getStudentById = async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const sessions = await StudySession.find({ studentId: req.params.id });
        const testResults = await TestResult.find({ userId: req.params.id }).sort({ createdAt: -1 });
        const completedTasks = await Task.find({ userId: req.params.id, completed: true });
        const loginLogs = await LoginLog.find({ userId: req.params.id }).sort({ loginTime: -1 });

        let completedCount = 0;
        let totalFocus = 0;
        let focusScores = [];

        // Group study hours by subject
        const subjectHours = {};

        // Group exact online seconds by week/date representation
        const exactDailyOnline = {};

        sessions.forEach(s => {
            if (s.status === 'Completed') {
                completedCount++;
                totalFocus += s.duration;
                if (s.focusScore) focusScores.push(s.focusScore);

                // Subjects Chart Data
                subjectHours[s.subject] = (subjectHours[s.subject] || 0) + s.duration;
            }
        });

        // Add completed task durations (eta in minutes) to total focus and charts
        completedTasks.forEach(t => {
            const duration = t.eta || 0;
            totalFocus += duration;
            subjectHours[t.subject] = (subjectHours[t.subject] || 0) + duration;
        });

        loginLogs.forEach(log => {
            const dateKey = new Date(log.loginTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            exactDailyOnline[dateKey] = (exactDailyOnline[dateKey] || 0) + (log.durationSeconds || 0);
        });

        // Convert grouped objects to array format for Recharts, dividing by 60 to convert minutes to hours
        const subjectsStudied = Object.keys(subjectHours).map(key => ({
            subject: key,
            hours: parseFloat((subjectHours[key] / 60).toFixed(1))
        }));

        const weeklyTrendArr = Object.keys(exactDailyOnline).map(key => ({
            date: key,
            hours: parseFloat((exactDailyOnline[key] / 3600).toFixed(2))
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const focusScoreAverage = focusScores.length > 0
            ? Math.round(focusScores.reduce((a, b) => a + b, 0) / focusScores.length)
            : 0;

        res.json({
            student: {
                id: student._id,
                name: student.name,
                email: student.email,
                joinedDate: student.createdAt,
                xp: student.xp,
                level: student.level,
                streak: student.streak,
                tasksCompleted: student.tasksCompleted,
                totalTasks: student.totalTasks
            },
            totalStudyHours: totalFocus / 60,
            subjectsStudied,
            weeklyTrendArr,
            focusScoreAverage,
            completedSessionsCount: completedCount,
            testResults,
            loginLogs
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get Platform Analytics
exports.getAnalytics = async (req, res) => {
    try {
        const totalStudentsCount = await User.countDocuments({ isGuest: false });

        const sessions = await StudySession.find({ status: 'Completed' });

        let totalStudyHours = 0;
        const subjectCounts = {};
        const studentHours = {}; // studentId -> hours

        sessions.forEach(s => {
            totalStudyHours += s.duration;
            subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + s.duration;

            const sId = s.studentId.toString();
            studentHours[sId] = (studentHours[sId] || 0) + s.duration;
        });

        const averageStudyHoursPerStudent = totalStudentsCount > 0 ? (totalStudyHours / totalStudentsCount).toFixed(1) : 0;

        // Find most studied subject
        let mostStudiedSubject = "None";
        let maxSubHr = 0;
        for (const [sub, hrs] of Object.entries(subjectCounts)) {
            if (hrs > maxSubHr) {
                maxSubHr = hrs;
                mostStudiedSubject = sub;
            }
        }

        // Top 5 Students
        const sortedStudents = Object.keys(studentHours)
            .sort((a, b) => studentHours[b] - studentHours[a])
            .slice(0, 5);

        const topPerformers = await Promise.all(sortedStudents.map(async (id) => {
            const u = await User.findById(id).select('name');
            return {
                name: u ? u.name : 'Unknown',
                hours: studentHours[id]
            };
        }));

        res.json({
            totalStudents: totalStudentsCount,
            totalStudyHours,
            averageStudyHoursPerStudent: parseFloat(averageStudyHoursPerStudent),
            mostStudiedSubject,
            topPerformers
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
