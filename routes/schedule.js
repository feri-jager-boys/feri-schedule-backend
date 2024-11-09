const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware');

const { getFullScheduleForUser, getPrograms, getFullSchedule} = require('../implementations/schedule');

router.get('/getFullForUser/:week', authenticateJWT, getFullScheduleForUser);
router.get('/getFull/:grade/:week', getFullSchedule);

router.get('/getPrograms', getPrograms);

module.exports = router;
