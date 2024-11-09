const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    gradeId: { type: mongoose.Schema.Types.ObjectId, ref: 'grades' },
    professor: { type: String },
    classroom: { type: String },
    type: { type: String },
    group: { type: String },
    subject: { type: String },
    day: { type: Number },
    time: { type: String },
    week: { type: Number }
}, { timestamps: true, _id: true });

const Schedule = mongoose.model('schedules', scheduleSchema);

module.exports = Schedule;
