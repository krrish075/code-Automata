const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    userSelectedIndex: { type: Number, required: true, default: -1 }, // -1 means omitted/timeout
    explanation: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }
});

const testResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subjectName: { type: String, required: true, default: 'General' },
    testName: { type: String, required: true, default: 'Custom Practice Test' },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    questions: [questionSchema]
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);
