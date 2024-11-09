const { setFullSchedule } = require('./scraper');

const updateSchedule = async () => {
    await setFullSchedule()
        .then(
            (error) => { console.log(error) });
}

module.exports = { updateSchedule };
