const Schedule = require('../models/schedule');
const Program = require('../models/program');
const Grade = require('../models/grade');

const getFullScheduleForUser = async (req, res) => {
    try {
        const gradeId = req.user.grade;
        const week = req.params.week;
        const schedules = await Schedule.find({gradeId: gradeId, week});
        res.send(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        throw error;
    }
};

const getFullSchedule = async (req, res) => {
    try {
        const gradeId = req.params.grade;
        const week = req.params.week;
        const schedules = await Schedule.find({gradeId: gradeId, week});
        res.send(schedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
        res.status(500).send("Error fetching schedules");
    }
};

const getPrograms = async (req, res) => {
    try {
        const programs = await Program.find();

        const response = [];

        for (const program of programs) {
            await program;

            const gradeElements = await Grade.find({programId: program._id});

            const gradesResponse = [];

            for (const grade of gradeElements) {
                const scheduleElements = await Schedule.find({gradeId: grade._id});

                const allGroupNames = scheduleElements.flatMap(schedule => schedule.groups);
                const uniqueGroupNames = [...new Set(allGroupNames)];

                const uniqueSubjects = [...new Set(scheduleElements.map(schedule => schedule.subject))];

                gradesResponse.push({
                    grade: grade.grade,
                    gradeId: grade._id,
                    groups: uniqueGroupNames,
                    subjects: uniqueSubjects,
                })
            }

            response.push({
                id: program._id,
                name: program.name,
                gradeItems: gradesResponse
            })
        }

        res.send(response);
    } catch (error) {
        console.error("Error fetching programs:", error);
       res.status(500).send("Error fetching programs");
    }
};

module.exports = { getFullScheduleForUser, getFullSchedule, getPrograms };
