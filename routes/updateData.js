const express = require('express');
const router = express.Router();

const {updateSchedule} = require('../implementations/updateData');

// update/schedule -> update the schedule in the database by scraping it from the website
router.get('/schedule', async function(req, res, next) {
    await updateSchedule();
    res.json({result: "success"});
});

module.exports = router;
