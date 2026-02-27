const cron = require('node-cron');
const Timetable = require('./models/Timetable');
const Subject = require('./models/Subject');
const { generateAlgorithm } = require('./controllers/timetableController');

const startCronJobs = () => {
    // Run every midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily midnight cron job for Timetable Planner...');

        try {
            const now = new Date();

            // 1. Mark missed tasks: anything Scheduled for a date < today
            const todayStart = new Date(now);
            todayStart.setHours(0, 0, 0, 0);

            const missedTasks = await Timetable.find({
                status: 'Scheduled',
                date: { $lt: todayStart }
            });

            // Group by user to know whose timetables to regenerate
            const usersToRegenerate = new Set();

            for (let task of missedTasks) {
                task.status = 'Missed';
                await task.save();

                // Add hours back to subject
                const subject = await Subject.findById(task.subject);
                if (subject) {
                    subject.remainingHours += task.duration;
                    await subject.save();
                }

                usersToRegenerate.add(task.userId.toString());
            }

            // Also find users who have upcoming deadlines (<= 3 days)
            // so case 1 triggers regeneration
            const threeDaysFromNow = new Date(todayStart);
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const subjectsNearDeadline = await Subject.find({
                remainingHours: { $gt: 0 },
                deadline: { $lt: threeDaysFromNow }
            });

            for (let subject of subjectsNearDeadline) {
                usersToRegenerate.add(subject.userId.toString());
            }

            // Regenerate for affected users
            for (let userId of usersToRegenerate) {
                console.log(`Regenerating timetable for user ${userId} due to missed tasks or near deadlines.`);
                await generateAlgorithm(userId);
            }

            console.log('Cron job completed successfully.');
        } catch (error) {
            console.error('Error running cron job:', error);
        }
    });
};

module.exports = startCronJobs;
