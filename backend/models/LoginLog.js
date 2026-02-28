const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    loginTime: { type: Date, required: true, default: Date.now },
    logoutTime: { type: Date }, // Updated via heartbeat or actual logout
    durationSeconds: { type: Number, default: 0 } // Calculated on logout or heartbeat
}, { timestamps: true });

module.exports = mongoose.model('LoginLog', loginLogSchema);
