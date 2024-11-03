const puppeteer = require("puppeteer");

const url =
    "https://www.wise-tt.com/wtt_um_feri/index.jsp?filterId=0;389,569;0;0;"; // RIT MAG 1.letnik

const openWeekXPath = '//*[@id="form:j_idt147"]';
const currentWeekXPath = '//*[@id="form:j_idt147_input"]';

const startTime = 7;

const getFullSchedule = async (result) => {
    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null,
        });

        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
        });

        const [selectedWeekElement] = await page.$x(currentWeekXPath);

        const selectedWeekValue = await selectedWeekElement.evaluate(
            (select) => select.value
        );

        const [selectWeek] = await page.$x(openWeekXPath);

        await selectWeek.click();
        for (let i = 0; i < selectedWeekValue; i++) {
            await page.keyboard.press("ArrowUp");
        }
        await page.keyboard.press("Enter");

        let schedule = [];

        for (let i = 1; i < 52; i++) {
            if (i !== 1) {
                const [selectWeek] = await page.$x(openWeekXPath);
                await selectWeek.click();
                await page.keyboard.press("ArrowDown");
                await page.keyboard.press("Enter");
            }

            await new Promise((resolve) => setTimeout(resolve, 500));

            const calendarTable = await page.$("#mainCalendar");
            if (calendarTable) {
                await getScheduleForWeek(calendarTable, schedule, i);
            } else {
                console.error("Calendar table not found after DOM change.");
            }
        }

        resolve(schedule);
        await browser.close();
    });
};

const getScheduleForWeek = async (calendarTable, schedule, week) => {
    if (calendarTable) {
        const inputs = await calendarTable.$$("input");

        for (let i = 0; i < inputs.length; i++) {
            const value = await inputs[i].evaluate((element) =>
                element.getAttribute("value")
            );
            const id = await inputs[i].evaluate((element) =>
                element.getAttribute("id")
            );

            if (id && id.endsWith("Hour")) {
                if (value) {
                    const subjectWithType = await inputs[i + 2].evaluate((element) =>
                        element.getAttribute("value")
                    );
                    const groupValue = await inputs[i + 1].evaluate((element) =>
                        element.getAttribute("value")
                    );

                    const lastSpaceIndex = subjectWithType.lastIndexOf(" ");

                    const type = subjectWithType
                        .substring(lastSpaceIndex + 1)
                        .replace(/[()]/g, "");
                    const subject = subjectWithType.slice(0, lastSpaceIndex);

                    const valueSplit = value.split(", ");
                    const timeValues = id.split(":");
                    const groupSplit = groupValue.split(" ");

                    const day = parseInt(timeValues[4]);
                    const timeIndex = timeValues[2];

                    const professor = valueSplit[0];
                    const classroom = valueSplit[1];

                    const group =
                        groupSplit[groupSplit.length - 2] +
                        groupSplit[groupSplit.length - 1];

                    const time = startTime + timeIndex / 2;

                    schedule.push({
                        professor,
                        classroom,
                        type,
                        group,
                        subject,
                        day,
                        time,
                        week,
                    });
                }
            }
        }
    }

    return schedule;
};

module.exports = {getFullSchedule}
