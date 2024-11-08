const puppeteer = require("puppeteer");
const assert = require("node:assert");

const url = "https://www.wise-tt.com/wtt_um_feri/index.jsp";

const programClickCssSelector = "#form\\:j_idt175";
const programValueCssSelector = "#form\\:j_idt175_label";
const programOptionsCssSelector = "#form\\:j_idt175 option";

const yearClickCssSelector = "#form\\:j_idt179";
const yearValueCssSelector = "#form\\:j_idt179_label";
const yearOptionsCssSelector = "#form\\:j_idt179 option";

const weekClickCssSelector = "#form\\:j_idt147";
const weekValueCssSelector = "#form\\:j_idt147_label";
const weekOptionsCssSelector = "#form\\:j_idt147 option";

const startTime = 7;

const getFullSchedule = async (result) => {
    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            headless: "new",
            defaultViewport: null,
        });

        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
        });

        let schedule = [];

        const programOptions = await page.$$(programOptionsCssSelector);

        console.log("Starting to parse")

        for (let i = 0; i < programOptions.length - 1; i++) {
            await (await page.$(programClickCssSelector)).click();
            await page.keyboard.press("ArrowDown");
            await page.keyboard.press("Enter");
            await new Promise((resolve) => setTimeout(resolve, 500));

            const currentProgramName = await page.$eval(programValueCssSelector, (select) => select.textContent);

            console.log(`> program ${currentProgramName}`)

            await getScheduleForProgram(page, schedule, currentProgramName);
        }

        resolve(schedule);

        await browser.close();
    });
};

const getScheduleForProgram = async (page, schedule, currentProgram) => {
    const yearOptions = await page.$$(yearOptionsCssSelector);
    const weekOptions = await page.$$(weekOptionsCssSelector);

    for (let i = 0; i < yearOptions.length - 1; i++) {
        process.stdout.write(`>> year ${i}: `)

        if (i !== 0) {
            process.stdout.write("selecting... ");

            await (await page.$(yearClickCssSelector)).click();
            await page.keyboard.press("ArrowDown");
            await new Promise((resolve) => setTimeout(resolve, 500));

            await page.waitForFunction(
                (select, value) => { return document.querySelector(select).textContent === value.toString() },
                {}, yearValueCssSelector, i + 1);

            await page.keyboard.press("Enter");
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        process.stdout.write("parsing...\n");

        const currentYearNum = await page.$eval(yearValueCssSelector, (select) => select.textContent);

        assert(currentYearNum === (i + 1).toString(), `Current year must be ${i + 1} at this point and not '${currentYearNum}'`);

        await (await page.$(weekClickCssSelector)).click();
        await new Promise((resolve) => setTimeout(resolve, 100));

        const currentWeekNum = await page.$eval(weekValueCssSelector, (select) => select.textContent);

        process.stdout.write(`>>> Moving week from ${currentWeekNum} to 1: `);

        for (let j = Number(currentWeekNum) - 1; j >= 1; j--) {
            process.stdout.write(`${j} `);

            await page.keyboard.press("ArrowUp");
            await new Promise((resolve) => setTimeout(resolve, 500));

            await page.waitForFunction(
                (select, value) => { return document.querySelector(select).textContent === value.toString() },
                {}, weekValueCssSelector, j);
        }

        process.stdout.write("DONE\n");

        await page.keyboard.press("Enter");
        await new Promise((resolve) => setTimeout(resolve, 100));

        const testWeek = await page.$eval(weekValueCssSelector, (select) => select.textContent);
        assert(testWeek === "1", `Current week must be 1 at this point and not '${testWeek}'`);

        for (let j = 1; j <= weekOptions.length; j++) {
            process.stdout.write(`>>> week ${j}: `)
            if (j !== 1) {
                process.stdout.write("selecting... ");

                await (await page.$(weekClickCssSelector)).click();
                await new Promise((resolve) => setTimeout(resolve, 100));
                await page.keyboard.press("ArrowDown");
                await new Promise((resolve) => setTimeout(resolve, 500));

                await page.waitForFunction(
                    (select, value) => { return document.querySelector(select).textContent === value.toString() },
                    {}, weekValueCssSelector, j);

                await page.keyboard.press("Enter");
            }
            process.stdout.write("parsing...\n");

            const testWeek = await page.$eval(weekValueCssSelector, (select) => select.textContent);
            assert(testWeek === j.toString(), `Current week must be '${j}' at this point and not '${testWeek}'`);

            const calendarTable = await page.$("#mainCalendar");
            if (calendarTable) {
                await getScheduleForWeek(calendarTable, schedule, j, currentProgram, currentYearNum);
            } else {
                console.error("Calendar table not found after DOM change.");
            }

            await new Promise((resolve) => setTimeout(resolve, 200));
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
