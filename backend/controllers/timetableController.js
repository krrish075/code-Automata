const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

// Slot capacities in hours
const SLOT_CAPACITY = {
    Morning: 3,  // 6-9 AM
    Evening: 3,  // 4-7 PM
    Night: 2     // 8-10 PM
};

exports.addSubject = async (req, res) => {
    try {
        const { subject, deadline, difficulty, preferredTime, maxDailyHours } = req.body;
        const newSubject = new Subject({
            subject,
            deadline,
            difficulty,
            remainingHours: 10,
            preferredTime,
            maxDailyHours,
            userId: req.user.id
        });
        await newSubject.save();
        res.status(201).json(newSubject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user.id }).sort({ deadline: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await Subject.findOneAndDelete({ _id: id, userId: req.user.id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json({ message: 'Subject removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const calculatePriority = (subject, daysRemaining) => {
    if (daysRemaining <= 0) return 9999;

    let score = (1 / daysRemaining) * 50 + (subject.difficulty * 10) + (subject.remainingHours / daysRemaining);

    // Case 1: Deadline Near
    if (daysRemaining <= 3) {
        score *= 1.5;
    }
    return score;
};

const generateAlgorithm = async (userId) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Delete all future scheduled slots for this user to regenerate cleanly
    await Timetable.deleteMany({
        userId: userId,
        status: 'Scheduled',
        date: { $gte: todayStart }
    });

    const subjects = await Subject.find({ userId: userId, remainingHours: { $gt: 0 } });

    if (subjects.length === 0) return;

    let simSubjects = subjects.map(s => ({
        ...s.toObject(),
        simRemaining: s.remainingHours
    }));

    let currentDate = new Date(todayStart);

    const maxDate = new Date(Math.max(...simSubjects.map(s => new Date(s.deadline))));
    maxDate.setDate(maxDate.getDate() + 30);

    while (simSubjects.some(s => s.simRemaining > 0) && currentDate <= maxDate) {
        let dailySlots = {
            Morning: SLOT_CAPACITY.Morning,
            Evening: SLOT_CAPACITY.Evening,
            Night: SLOT_CAPACITY.Night
        };

        simSubjects.forEach(s => {
            let daysRem = Math.ceil((new Date(s.deadline) - currentDate) / (1000 * 60 * 60 * 24));
            if (daysRem < 1) daysRem = 1;
            s.priority = calculatePriority(s, daysRem);
            s.daysRem = daysRem;
            s.dailyAllocated = 0;
        });

        simSubjects.sort((a, b) => b.priority - a.priority);

        for (let s of simSubjects) {
            if (s.simRemaining <= 0) continue;

            let targetHoursToday = 0;
            if (s.daysRem > 7) {
                targetHoursToday = Math.ceil(s.simRemaining / s.daysRem);
            } else if (s.daysRem <= 3) {
                targetHoursToday = s.maxDailyHours;
            } else {
                targetHoursToday = Math.ceil(s.simRemaining / s.daysRem);
            }

            targetHoursToday = Math.min(targetHoursToday, s.maxDailyHours, s.simRemaining);

            while (targetHoursToday > 0 && s.dailyAllocated < s.maxDailyHours && s.simRemaining > 0) {
                let allocatedSlot = null;

                if (dailySlots[s.preferredTime] > 0) {
                    allocatedSlot = s.preferredTime;
                } else {
                    for (let slot of ['Morning', 'Evening', 'Night']) {
                        if (dailySlots[slot] > 0) {
                            allocatedSlot = slot;
                            break;
                        }
                    }
                }

                if (allocatedSlot) {
                    dailySlots[allocatedSlot] -= 1;
                    s.simRemaining -= 1;
                    s.dailyAllocated += 1;
                    targetHoursToday -= 1;

                    await new Timetable({
                        date: new Date(currentDate),
                        timeSlot: allocatedSlot,
                        subject: s._id,
                        status: 'Scheduled',
                        duration: 1,
                        userId: userId
                    }).save();
                } else {
                    break; // Day is full
                }
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }
};

exports.generateAlgorithm = generateAlgorithm;

exports.generateTimetable = async (req, res) => {
    try {
        await generateAlgorithm(req.user.id);
        const updatedTimetable = await Timetable.find({ userId: req.user.id })
            .populate('subject', 'subject')
            .sort({ date: 1 });
        res.json({ message: 'Timetable generated successfully', timetable: updatedTimetable });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.rescheduleTimetable = async (req, res) => {
    try {
        await generateAlgorithm(req.user.id);
        const updatedTimetable = await Timetable.find({ userId: req.user.id })
            .populate('subject', 'subject')
            .sort({ date: 1 });
        res.json({ message: 'Timetable rescheduled successfully', timetable: updatedTimetable });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.find({ userId: req.user.id })
            .populate('subject', 'subject')
            .sort({ date: 1 });
        res.json(timetable);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
