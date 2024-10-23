const express = require('express');
const router = express.Router();

const {getFullSchedule} = require('../implementations/schedule');

// schedule/getFull -> get the full schedule from the database
router.get('/getFull',function(req, res, next) {
    getFullSchedule().then((result) => {
        res.json({result});
    });
});

module.exports = router;
