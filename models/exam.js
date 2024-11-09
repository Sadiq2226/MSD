const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: {
        A: { type: String, required: true },
        B: { type: String, required: true },
        C: { type: String, required: true },
        D: { type: String, required: true }
    },
    correctAnswer: { type: String, required: true, enum: ['A', 'B', 'C', 'D'] } // Accepts only 'A', 'B', 'C', or 'D' as valid answers
});

const examSchema = new mongoose.Schema({
    examName: { type: String, required: true },
    subject: { type: String, required: true },
    examDate: { type: Date, required: true },
    questions: { type: [questionSchema], required: true }, // Array of question objects
    createdBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' } // Reference to User model
});

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
