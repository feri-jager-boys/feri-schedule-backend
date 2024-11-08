const Schedule = require('../models/schedule');

const getFullSchedule = async () => {
    try {
        const schedules = await Schedule.find();
        return schedules;
    } catch (error) {
        console.error("Error fetching schedules:", error);
        throw error;
    }
};


module.exports = {getFullSchedule};
