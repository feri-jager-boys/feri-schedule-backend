const { connectionInfo } = require('./connectionInfo');
const { MongoClient } = require('mongodb');

let client;

const connectToMongoDB = async () => {
    try {
        if (!client) {
            client = await MongoClient.connect(connectionInfo.connectionString, { useNewUrlParser: true });
            console.log("Connected to MongoDB");
        }
        return client;
    } catch (e) {
        console.error("Error connecting to MongoDB:", e);
        throw e;
    }
};

const getConnection = () => {
    if (!client) {
        console.error("MongoDB client is not connected. Call connectToMongoDB first.");
        return null;
    }
    return client;
};

module.exports = { connectToMongoDB, getConnection };
