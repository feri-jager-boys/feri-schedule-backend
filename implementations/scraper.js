const puppeteer = require("puppeteer");
const assert = require("node:assert");

const url = "https://www.wise-tt.com/wtt_um_feri/index.jsp";

const programClickCssSelector = "#form\\:j_idt175";
const programValueCssSelector = "#form\\:j_idt175_label";
const programOptionsCssSelector = "#form\\:j_idt175 option";
const programDirectValueClickCssSelector = "#form\\:j_idt175_";

const yearClickCssSelector = "#form\\:j_idt179";
const yearValueCssSelector = "#form\\:j_idt179_label";
const yearOptionsCssSelector = "#form\\:j_idt179 option";
const yearDirectValueClickCssSelector = "#form\\:j_idt179_";

const weekClickCssSelector = "#form\\:j_idt147";
const weekValueCssSelector = "#form\\:j_idt147_label";
const weekOptionsCssSelector = "#form\\:j_idt147 option";
const weekDirectValueClickCssSelector = "#form\\:j_idt147_";

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

        for (let i = 1; i < programOptions.length; i++) {
            await page.$eval(programClickCssSelector, el => el.click());
            await page.$eval(programDirectValueClickCssSelector + i.toString(), el => el.click());

            await new Promise((resolve) => setTimeout(resolve, 200));

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

    for (let i = 1; i < yearOptions.length; i++) {
        console.log(`>> year ${i}`);

        if (i !== 0) {
            await page.$eval(yearClickCssSelector, el => el.click());
            await page.$eval(yearDirectValueClickCssSelector + i, el => el.click());

            await new Promise((resolve) => setTimeout(resolve, 500));

            await page.waitForFunction(
                (select, value) => { return document.querySelector(select).textContent === value.toString() },
                {}, yearValueCssSelector, i);

            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const currentYearNum = await page.$eval(yearValueCssSelector, (select) => select.textContent);

        assert(currentYearNum === i.toString(), `Current year must be ${i} at this point and not '${currentYearNum}'`);

        console.log(">>> moving week to 1");

        await page.$eval(weekClickCssSelector, el => el.click());
        await new Promise((resolve) => setTimeout(resolve, 100));

        await page.$eval(weekDirectValueClickCssSelector + "0", el => el.click());

        await new Promise((resolve) => setTimeout(resolve, 500));

        await page.waitForFunction(
            (select, value) => { return document.querySelector(select).textContent === value.toString() },
            {}, weekValueCssSelector, 1);

        const testWeek = await page.$eval(weekValueCssSelector, (select) => select.textContent);
        assert(testWeek === "1", `Current week must be 1 at this point and not '${testWeek}'`);

        process.stdout.write(">>> parsing week... ")

        for (let j = 1; j <= weekOptions.length; j++) {
            process.stdout.write(`${j} `)

            if (j !== 1) {
                await page.$eval(weekClickCssSelector, el => el.click());
                await new Promise((resolve) => setTimeout(resolve, 100));
                await page.$eval(weekDirectValueClickCssSelector + (j - 1).toString(), el => el.click());
                await new Promise((resolve) => setTimeout(resolve, 500));

                await page.waitForFunction(
                    (select, value) => { return document.querySelector(select).textContent === value.toString() },
                    {}, weekValueCssSelector, j);

                await new Promise((resolve) => setTimeout(resolve, 100));
            }

            const testWeek = await page.$eval(weekValueCssSelector, (select) => select.textContent);
            assert(testWeek === j.toString(), `Current week must be '${j}' at this point and not '${testWeek}'`);

            const calendarTable = await page.$("#mainCalendar");
            if (calendarTable) {
                await getScheduleForWeek(calendarTable, schedule, j, currentProgram, currentYearNum);
            } else {
                console.error("Calendar table not found after DOM change.");
            }

            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        process.stdout.write("DONE\n")
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
