const puppeteer = require("puppeteer");

const url = "https://www.wise-tt.com/wtt_um_feri/index.jsp?filterId=0;389,569;0;0;"; // RIT MAG 1.letnik

const openWeekXPath = '//*[@id="form:j_idt149"]/div[3]';

const startTime = 7;

const getFullSchedule = async (result) => {
    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null,
        });

        const page = await browser.newPage();

        await page.goto((url), {
            waitUntil: "domcontentloaded",
        });

        const openWeek = await page.$x(openWeekXPath);

        if (openWeek.length > 0) {
            await openWeek[0].click();
            const selectWeek = await page.$x(selectWeekXPath);

            if (selectWeek.length > 0) {
                await selectWeek[0].click();
            }
        }

        setTimeout(async () => {
            const calendarTable = await page.$('#mainCalendar')
            const schedule = await getSchedule(calendarTable);
            resolve(schedule);

            await browser.close();
        }, 2000);
    });
}

const getSchedule = async (calendarTable) => {
    let schedule = [];

    if (calendarTable) {
        const inputs = await calendarTable.$$('input');

        for (let i = 0; i < inputs.length; i++) {
            const value = await inputs[i].evaluate(element => element.getAttribute('value'));
            const id = await inputs[i].evaluate(element => element.getAttribute('id'));

            if (id && id.endsWith("Hour")) {
                if (value) {
                    const subjectWithType = await inputs[i + 2].evaluate(element => element.getAttribute('value'))
                    const groupValue = await inputs[i + 1].evaluate(element => element.getAttribute('value'))

                    const lastSpaceIndex = subjectWithType.lastIndexOf(" ");

                    const type = subjectWithType.substring(lastSpaceIndex + 1).replace(/[()]/g, '');
                    const subject = subjectWithType.slice(0, lastSpaceIndex);

                    const valueSplit = value.split(", ")
                    const timeValues = id.split(":");
                    const groupSplit = groupValue.split(" ");

                    const day = parseInt(timeValues[4]);
                    const timeIndex = timeValues[2];

                    const professor = valueSplit[0];
                    const classroom = valueSplit[1];

                    const group = groupSplit[groupSplit.length - 2] + groupSplit[groupSplit.length - 1];

                    const time = startTime + (timeIndex / 2);

                    schedule.push({
                        professor,
                        classroom,
                        type,
                        group,
                        subject,
                        day,
                        time
                    })
                }
            }
        }
    }

    return schedule;
};

module.exports = {getFullSchedule}
