const mongoose  = require("mongoose");

const gradeSchema = new mongoose.Schema({
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'programs' },
    grade: { type: Number, required: true },
}, { timestamps: true, _id: true });

const Grade = mongoose.model('grades', gradeSchema);

module.exports = Grade;
