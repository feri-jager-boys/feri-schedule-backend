const {getFullSchedule, scrape} = require('./scraper');
const Schedule = require('../models/schedule');

const updateSchedule = async () => {

    await getFullSchedule().then(async (result) => {
        await Schedule.deleteMany({});
        await Schedule.insertMany(result);
    },
        (error) => {
            console.log(error)
        });

}

const scrapeData = async () => {
    await scrape();
}

module.exports = {updateSchedule, scrapeData};
