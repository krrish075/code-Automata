const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: function () { return !this.isGuest; }, unique: true, sparse: true },
    password: { type: String, required: function () { return !this.isGuest; } },
    isGuest: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    totalStudyMinutes: { type: Number, default: 0 },
    focusHours: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    isDark: { type: Boolean, default: false },
    timetable: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
