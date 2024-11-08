const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization

    if (!token) {
        return res.sendStatus(403);
    }
    const bearerToken = token.split(' ')[1];

    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log(err)
            return res.sendStatus(403);
        }

        req.user = {
            id: user.userId,
            username: user.username
        };

        next();
    });
};
