const Schedule = require('../models/schedule');
const Program = require('../models/program');
const Grade = require('../models/grade');

const getFullSchedule = async () => {
    try {
        const schedules = await Schedule.find();
        return schedules;
    } catch (error) {
        console.error("Error fetching schedules:", error);
        throw error;
    }
};

const getPrograms = async () => {
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

        return response;
    } catch (error) {
        console.error("Error fetching programs:", error);
        throw error;
    }
};

module.exports = { getFullSchedule, getPrograms };
