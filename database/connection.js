const mongoose = require("mongoose");
const {connectionString} = require("./connectioninfo");

async function connectToDatabase() {
    try {
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

module.exports = { connectToDatabase };
