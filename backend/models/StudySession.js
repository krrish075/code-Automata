const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    duration: { type: Number, required: true }, // in hours
    date: { type: Date, required: true, default: Date.now },
    focusScore: { type: Number, default: 0 },
    status: { type: String, enum: ['Completed', 'Missed'], default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('StudySession', studySessionSchema);
