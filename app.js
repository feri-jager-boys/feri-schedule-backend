const express = require('express');
const cors = require('cors');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const updateDataRouter = require('./routes/updateData');
const scheduleRouter = require('./routes/schedule');
const cron = require('node-cron');

const app = express();

const {updateSchedule} = require('./implementations/updateData');

const {connectToMongoDB} = require('./database/connection');

app.use(cors({
  origin: ["http://localhost:4200"],
  method: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));

app.use('/update', updateDataRouter);
app.use('/schedule', scheduleRouter);

app.use(express.json());

cron.schedule('0 0 * * *', async () => {
  console.log('Updating schedule...')
  await updateSchedule();
  console.log('Schedule updated.')
});

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  key: "userId",
  secret: "this-should-be-something-very-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 3600 * 3600
  }
}))

const PORT = 3080;

app.listen(PORT, () => {
  connectToMongoDB().then(() => {});
  console.log("App listening at port 3080.");
})
