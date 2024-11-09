const puppeteer = require("puppeteer");
const assert = require("node:assert");

const Program = require("../models/program");
const Grade = require("../models/grade");
const Schedule = require("../models/schedule");

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

const htmlProgressClassName = "progress";

const startTime = 7;

const setFullSchedule = async (_) => {
    return new Promise(async (resolve, reject) => {
        const browser = await puppeteer.launch({
            headless: "new",
            defaultViewport: null,
        });

        const page = await browser.newPage();

        await page.goto(url, {
            waitUntil: "domcontentloaded",
        });

        const programOptions = await page.$$(programOptionsCssSelector);

        console.log("Starting to parse")

        for (let i = 1; i < programOptions.length; i++) {
            await page.$eval(programClickCssSelector, el => el.click());
            await page.$eval(programDirectValueClickCssSelector + i.toString(), el => el.click());

            await new Promise((_) => setTimeout(_, 500));

            const currentProgramName = await page.$eval(programValueCssSelector, select => select.textContent);

            console.log(`> program ${currentProgramName}`)

            const programModel = await Program.findOne({ name: currentProgramName }).then(
                async (existingElement) => {
                    if (existingElement == null) {
                        const program = new Program({name: currentProgramName});
                        await program.save();
                        console.log("> saved program to db")
                        return program;
                    }
                    return existingElement;
                }
            );

            await setScheduleForProgram(page, programModel);
        }

        await browser.close();

        resolve();
    });
};

const setScheduleForProgram = async (page, programModel) => {
    const yearOptions = await page.$$(yearOptionsCssSelector);
    const weekOptions = await page.$$(weekOptionsCssSelector);

    for (let i = 1; i < yearOptions.length; i++) {
        console.log(`>> year ${i}`);

        await page.waitForFunction(
            (cls) => { return !document.documentElement.classList.contains(cls) },
            {}, htmlProgressClassName);

        if (i !== 0) {
            await page.$eval(yearClickCssSelector, el => el.click());
            await page.$eval(yearDirectValueClickCssSelector + i, el => el.click());

            await new Promise((_) => setTimeout(_, 500));

            await page.waitForFunction(
                (select, value) => { return document.querySelector(select).textContent === value.toString() },
                {}, yearValueCssSelector, i);
        }

        const currentYearNum = await page.$eval(yearValueCssSelector, (select) => select.textContent);
        assert(currentYearNum === i.toString(), `Current year must be ${i} at this point and not '${currentYearNum}'`);

        const gradeModel = await Grade.findOne({ programId: programModel._id, grade: parseInt(currentYearNum) }).then(
            async (existingElement) => {
                if (existingElement == null) {
                    const grade = new Grade({ programId: programModel._id, grade: parseInt(currentYearNum) });
                    await grade.save();
                    console.log("> saved grade to db")
                    return grade;
                }
                return existingElement;
            }
        );

        var schedule = [];

        console.log(">>> moving week to 1");

        await page.$eval(weekClickCssSelector, el => el.click());
        await page.$eval(weekDirectValueClickCssSelector + "0", el => el.click());

        await new Promise((_) => setTimeout(_, 200));

        await page.waitForFunction(
            (select, value) => { return document.querySelector(select).textContent === value.toString() },
            {}, weekValueCssSelector, 1);

        const testWeek = await page.$eval(weekValueCssSelector, (select) => select.textContent);
        assert(testWeek === "1", `Current week must be 1 at this point and not '${testWeek}'`);

        process.stdout.write(">>> parsing week... ")

        for (let j = 1; j <= weekOptions.length; j++) {
            process.stdout.write(`${j} `)

            await page.waitForFunction(
                (cls) => { return !document.documentElement.classList.contains(cls) },
                {}, htmlProgressClassName);

            await page.$eval(weekClickCssSelector, el => el.click());
            await page.$eval(weekDirectValueClickCssSelector + (j - 1).toString(), el => el.click());

            await new Promise((_) => setTimeout(_, 500));

            await page.waitForFunction(
                (cls) => { return !document.documentElement.classList.contains(cls) },
                {}, htmlProgressClassName);

            await page.waitForFunction(
                (select, value) => { return document.querySelector(select).textContent === value.toString() },
                {}, weekValueCssSelector, j);

            const testWeek = await page.$eval(weekValueCssSelector, (select) => select.textContent);
            assert(testWeek === j.toString(), `Current week must be '${j}' at this point and not '${testWeek}'`);

            const calendarTable = await page.$("#mainCalendar");
            if (calendarTable) {
                await setScheduleForWeek(calendarTable, schedule, j, gradeModel);
            } else {
                console.error("Calendar table not found after DOM change.");
            }
        }

        await Schedule.insertMany(schedule);

        process.stdout.write("DONE\n")
    }

    return schedule;
};

const setScheduleForWeek = async (calendarTable, schedule, week, gradeModel) => {
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

                    schedule.push(new Schedule({
                        gradeId: gradeModel._id,
                        professor: professor,
                        classroom: classroom,
                        type: type,
                        group: group,
                        subject: subject,
                        day: day,
                        time: time,
                        week: week,
                    }));
                }
            }
        }
    }

    return schedule;
};

module.exports = { setFullSchedule };
