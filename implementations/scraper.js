const puppeteer = require("puppeteer");

const url = "https://www.wise-tt.com/wtt_um_feri/index.jsp";

const openWeekXPath = '//*[@id="form:j_idt147"]';
const selectedWeekXPath = '//*[@id="form:j_idt147_label"]';

const openProgramXPath = '//*[@id="form:j_idt175"]';
const selectedProgramXPath = '//*[@id="form:j_idt175_label"]';

const openYearXPath = '//*[@id="form:j_idt179"]';
const selectedYearXPath = '//*[@id="form:j_idt179_label"]';

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

        let schedule = [];

        const [selectProgram1] = await page.$x(openProgramXPath);
        const programOptions = await selectProgram1.$$("option");

        for (let i = 0; i < programOptions.length - 1; i++) {
            const [selectProgram] = await page.$x(openProgramXPath);
            await selectProgram.click();
            await page.keyboard.press("ArrowDown");
            await page.keyboard.press("Enter");

            const [currentProgramLabel] = await page.$x(selectedProgramXPath);
            const currentProgramName = await currentProgramLabel.evaluate((select) => select.textContent);

            await new Promise((resolve) => setTimeout(resolve, 2000));

            await getScheduleForProgram(page, schedule, currentProgramName);
        }

        resolve(schedule);

        await browser.close();
    });
};

const getScheduleForProgram = async (page, schedule, currentProgram) => {
    const [selectYear] = await page.$x(openYearXPath);
    const yearOptions = await selectYear.$$("option");

    const [selectWeek] = await page.$x(openWeekXPath);
    const weekOptions = await selectWeek.$$("option");

    for (let i = 0; i < yearOptions.length; i++) {
        if (i !== 0) {
            const [selectYear] = await page.$x(openYearXPath);
            await selectYear.click();
            await page.keyboard.press("ArrowDown");
            await page.keyboard.press("Enter");
        }

        const [currentWeekLabel] = await page.$x(selectedWeekXPath);
        const currentWeekNum = await currentWeekLabel.evaluate((select) => select.textContent);

        const [selectWeek2] = await page.$x(openWeekXPath);
        await selectWeek2.click();
        for (let k = 0; k < Number(currentWeekNum); k++) {
            await page.keyboard.press("ArrowUp");
        }
        await page.keyboard.press("Enter");

        for (let j = 0; j < weekOptions.length; j++) {
            if (j !== 0) {
                const [selectWeek] = await page.$x(openWeekXPath);
                await selectWeek.click();
                await page.keyboard.press("ArrowDown");
                await page.keyboard.press("Enter");
            }

            const [currentWeekLabel] = await page.$x(selectedWeekXPath);
            const currentWeekNum = await currentWeekLabel.evaluate((select) => select.textContent);

            const [currentYearLabel] = await page.$x(selectedYearXPath);
            const currentYearNum = await currentYearLabel.evaluate((select) => select.textContent);

            await new Promise((resolve) => setTimeout(resolve, 500));

            const calendarTable = await page.$("#mainCalendar");
            if (calendarTable) {
                await getScheduleForWeek(calendarTable, schedule, currentWeekNum, currentProgram, currentYearNum);
            } else {
                console.error("Calendar table not found after DOM change.");
            }
        }
    }

    return schedule;
};

const getScheduleForWeek = async (calendarTable, schedule, week, program, year) => {
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
                        program,
                        year,
                    });
                }
            }
        }
    }

    return schedule;
};

module.exports = {getFullSchedule}
