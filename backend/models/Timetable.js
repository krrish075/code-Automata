const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    timeSlot: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Missed'], default: 'Scheduled' },
    duration: { type: Number, required: true, default: 1 }, // in hours
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
