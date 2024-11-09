const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization

    if (!token) {
        return res.sendStatus(403);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return res.sendStatus(403);
        }

        req.user = {
            id: user.userId,
            username: user.username,
            grade: user.grade
        };

        next();
    });
};
