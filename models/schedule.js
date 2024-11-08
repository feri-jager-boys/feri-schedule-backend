const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    // configuration_id: { type: Number, required: true },
    professor: { type: String, maxlength: 45 },
    classroom: { type: String, maxlength: 45 },
    type: { type: String, maxlength: 45 },
    group: { type: String, maxlength: 45 },
    subject: { type: String, maxlength: 45 },
    day: { type: String, maxlength: 45 },
    time: { type: String, maxlength: 45 },
    week: { type: String, maxlength: 45 }
}, { timestamps: true });

const Schedule = mongoose.model('schedule_items', scheduleSchema);

module.exports = Schedule;
