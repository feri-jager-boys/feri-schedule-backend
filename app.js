const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');

const updateDataRouter = require('./routes/updateData');
const scheduleRouter = require('./routes/schedule');
const usersRouter = require('./routes/users');

const app = express();
const { updateSchedule } = require('./implementations/updateData');
const { connectToDatabase} = require('./database/connection');

app.use(cors({
  origin: ["http://localhost:4200"],
  method: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));

// Move the JSON parser here
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes come after the parsers
app.use('/update', updateDataRouter);
app.use('/schedule', scheduleRouter);
app.use('/users', usersRouter);

cron.schedule('0 0 * * *', async () => {
  console.log('Updating schedule...');
  await updateSchedule();
  console.log('Schedule updated.');
});

const PORT = 3080;

app.listen(PORT, () => {
  connectToDatabase();
  console.log("App listening at port 3080.");
});
