const bcrypt = require('bcrypt');
const User = require('../models/users');
const jwt = require("jsonwebtoken");
const {ObjectId} = require("mongodb");
require('dotenv').config();

exports.register = async (req, res) => {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword,
        });

        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({username});
        if (!user) return res.status(400).send('User not found');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).send('Invalid password');

        const token = jwt.sign({ userId: user._id, username: user.username, grade: user.grade }, process.env.JWT_SECRET);
        res.json({ token: token});
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

exports.getLoggedInUser = (req, res) => {
    const token = req.headers.authorization

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Failed to authenticate token' });
        }
        try {
            const user = await User.findOne({username: decoded.username});
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            return res.status(200).json({ id: user._id, username: user.username });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
};

exports.updateUserGrade = async (req, res) => {
    const token = req.headers.authorization

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Failed to authenticate token' });
        }
        try {
            const user = await User.findOne({username: decoded.username});
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            user.grade = new ObjectId(req.body.grade);
            await user.save();
            return res.status(200).json({ id: user._id, username: user.username, grade: new ObjectId(user.grade) });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
}
