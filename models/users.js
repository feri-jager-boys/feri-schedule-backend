const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'grades' }
}, { timestamps: true });

const User = mongoose.model('users', userSchema);

module.exports = User;
