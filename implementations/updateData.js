const {getConnection} = require('../database/connection');
const {getFullSchedule, scrape} = require('./scraper');

const updateSchedule = async () => {
    const db = getConnection();
    const collection = db.db("schedule_generator").collection("schedule_items");

    await getFullSchedule().then((result) => {
        collection.deleteMany({})
        collection.insertMany(result);
    },
        (error) => {
            console.log(error)
        });

}

const scrapeData = async () => {
    await scrape();
}

module.exports = {updateSchedule, scrapeData};
