const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env
dotenv.config();

// Models
const User = require('./models/User');
const Task = require('./models/Task');
const StudySession = require('./models/StudySession');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-academi-planner';

const seedOMUser = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Check if user OM already exists to avoid duplicates
        let omUser = await User.findOne({ email: 'om@test.com' });

        if (omUser) {
            console.log('OM user already exists, clearing old data...');
            await Task.deleteMany({ userId: omUser._id });
            await StudySession.deleteMany({ studentId: omUser._id });
        } else {
            console.log('Creating new OM user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            omUser = await User.create({
                name: 'OM',
                email: 'om@test.com',
                password: hashedPassword,
                isGuest: false,
                xp: 3250,
                level: 7,
                streak: 12
            });
        }

        console.log(`User OM created/found with ID: ${omUser._id}`);

        // 2. Add 10 Tasks (6 Completed = 60%)
        console.log('Generating 10 tasks (6 completed, 4 pending)...');
        const tasksToCreate = [];
        const subjects = ['Mathematics', 'Physics', 'Computer Science', 'History', 'Literature'];

        for (let i = 0; i < 10; i++) {
            const isCompleted = i < 6; // First 6 are true, last 4 are false
            tasksToCreate.push({
                userId: omUser._id,
                subject: subjects[i % subjects.length],
                topic: `Chapter ${i + 1} Review`,
                eta: Math.floor(Math.random() * 60) + 30, // 30-90 mins
                timeSlot: i % 2 === 0 ? 'Morning' : 'Evening',
                priority: i % 3 === 0 ? 'high' : 'mid',
                completed: isCompleted
            });
        }

        await Task.insertMany(tasksToCreate);
        console.log('10 tasks created successfully.');

        // 3. Generate Study Sessions to populate analytics
        console.log('Generating study sessions...');
        const sessionsToCreate = [];
        let totalFocusMinutes = 0;
        let successfulSessions = 0;

        // Generate data for the past 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            // 80% chance to have studied that day
            if (Math.random() > 0.2) {
                const duration = Math.floor(Math.random() * 120) + 30; // 30-150 mins
                const score = Math.floor(Math.random() * 30) + 70; // 70-100% focus score

                totalFocusMinutes += duration;
                successfulSessions++;

                sessionsToCreate.push({
                    studentId: omUser._id,
                    subject: subjects[i % subjects.length],
                    duration: Math.floor(duration / 60) || 1, // Store as hours approx based on schema context
                    focusScore: score,
                    status: 'Completed',
                    date: d
                });
            } else {
                // Missed session
                sessionsToCreate.push({
                    studentId: omUser._id,
                    subject: subjects[i % subjects.length],
                    duration: 0,
                    focusScore: 0,
                    status: 'Missed',
                    date: d
                });
            }
        }

        await StudySession.insertMany(sessionsToCreate);
        console.log('Study sessions created successfully.');

        // 4. Update OM's summary stats
        omUser.totalStudyMinutes = totalFocusMinutes;
        omUser.focusHours = Math.floor(totalFocusMinutes / 60);
        omUser.totalTasks = 10;
        omUser.tasksCompleted = 6;
        await omUser.save();

        console.log('OM user stats updated.');
        console.log('--- SEEDING COMPLETE ---');
        console.log('Login with:');
        console.log('Email: om@test.com');
        console.log('Password: password123');
        process.exit(0);

    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedOMUser();
