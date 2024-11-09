const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
}, { timestamps: true, _id: true });

const Program = mongoose.model('programs', programSchema);

module.exports = Program;
