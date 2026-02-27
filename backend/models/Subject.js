const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    deadline: { type: Date, required: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    requiredHours: { type: Number, required: true },
    remainingHours: { type: Number, required: true },
    preferredTime: { type: String, enum: ['Morning', 'Evening', 'Night'], required: true },
    maxDailyHours: { type: Number, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
