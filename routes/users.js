const express = require('express');
const userController = require('../implementations/users');

const usersRouter = express.Router();

usersRouter.post('/register', userController.register);
usersRouter.post('/login', userController.login);
usersRouter.get('/getLoggedInUser', userController.getLoggedInUser);
usersRouter.post('/updateUserGrade', userController.updateUserGrade);

module.exports = usersRouter;

