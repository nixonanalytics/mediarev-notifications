import express from "express";
import cors from "cors";
import cron from "node-cron";
import { db } from "./database.js";
import {
  generateToken,
  getAllClients,
  getAllData,
  getScheduleTime,
  hasSimilarElements,
  queryAsync,
  readfile,
  sendEmail,
  setScheduleTime,
} from "./helpers.js";
const app = express();

let num = 1;
let schedule;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const connection = db.getConnection((err, connection) => {
  if (!err) return console.log("Database connected...");
  return console.log("Database couldn't connect...", err);
});

const layout = `<div class='article shadow_secondary Z7rPmDxqE9F5ybL3'><h2>{TITLE}</h2><p>{SUMMARY}</p><a href='https://mediarev.cervello.com.gh?id={URL}&utk={TOKEN}' class='button btn-gradient' target='_blank'>See More >>> </a></div>`;

let newString = "";

const setUpMail = async (story, token) => {
  // console.log(story)
  let modified = layout.replace("{TITLE}", story.title);
  modified = modified.replace(
    "{SUMMARY}",
    story.summary || story.articleSummary
  );
  modified = modified.replace("{URL}", story.mid);
  modified = modified.replace("{TOKEN}", token);
  newString = newString + modified;
};

const finalizeMail = async (newString, name) => {
  const file = await readfile("./mail.txt");
  //   console.log(newString)
  let finalResult = file.replace("{STORY}", newString);
  finalResult = finalResult.replace("{RECIPIENTNAME}", name);
  // console.log(finalResult);
  return finalResult;
  //   console.log(finalResult)
};

const handleProcessData = async (alldata, keywords, token) => {
  if (alldata.length) {
    for (const data of alldata) {
      const dataKeywords = data.keywords.split(",");
      const hasSimilarElement = await hasSimilarElements(
        keywords,
        dataKeywords
      );
      if (hasSimilarElement) {
        await setUpMail(data, token);
        // console.log("found similar");
      }
    }
  }
};

const handleMailService = async () => {
  try {
    // console.log("object")
    const allClients = await getAllClients();
    const alldata = await getAllData();

    // console.log(allClients)
    // console.log(alldata)

    for (const client of allClients) {
      const keywords = client.keywords.split(",");
      const token = generateToken(8);

      await handleProcessData(alldata.television, keywords, token);
      await handleProcessData(alldata.print, keywords, token);
      await handleProcessData(alldata.web, keywords, token);
      await handleProcessData(alldata.radio, keywords, token);

      if (newString.includes("Z7rPmDxqE9F5ybL3")) {
        const final = await finalizeMail(newString, client.username);
        console.log(
          `Sending mail to client ${client.username} at ${
            client.email
          } time: ${new Date()}`
        );
        // console.log(client)
        // console.log(final);
        const mail = await sendEmail(
          client.email,
          "News Clippings Alert | Media Rev",
          final
        );
        // console.log(mail);
        if (mail.response.startsWith("250")) {
          const insertQuery =
            "INSERT INTO emailDispatch(`uid`, `token`, `status`, `sendDate`) VALUES (?)";
          const values = [client.uid, token, "DISPATCHED", new Date()];

          const addDispatch = await queryAsync(insertQuery, [values]);
          console.log("Dispatch record added successfully");
        }
        newString = "";
      } else {
        console.log("No new posts to send...");
      }
    }
    console.log("DONE!");
  } catch (error) {
    console.log(error);
  }
};

const startCronService = async () => {
  schedule = await getScheduleTime();
  console.log("Starting up the notification service...");
  task.start();
};

// "0 0 * * *", 24hrs
// "0 * * * *" each hour
// "0 * * * * *" each minute
// "*/5 * * * * *", Cron expression to run every 5 seconds
const task = cron.schedule(
  "0 * * * *",
  () => {
    const currentHour = new Date().getHours();
    console.log(currentHour);
    // handleMailService();
    if (currentHour == schedule.first || currentHour == schedule.second) {
      console.log(`running task ${num}`);
      console.log(`Running task at ${currentHour}:00`);
      handleMailService();
      num += 1;
    }
  },
  {
    scheduled: false,
  }
);

// http://localhost:8000/changeCronSchedule?first=1&second=2

app.get("/changeCronSchedule", async (req, res) => {
  console.log(`Route: ${req.method} ${req.originalUrl}`);
  const { first, second } = req.query;
  // console.log(req.query)
  if (!first || !second)
    return res.status(404).send({ message: "Invalid request" });
  if (isNaN(first) || isNaN(second))
    return res.status(404).send({ message: "Invalid variables" });
  const setNewSchedule = await setScheduleTime(first, second);
  res.status(200).send({
    message: "schedule time updated...",
  });
  startCronService();
});

app.get("/", (req, res) => {
  console.log(`Route: ${req.method} ${req.originalUrl}`);
  res.status(200).send({
    message: "Starting up the notification service...",
  });
  startCronService();
});

app.get("/off", (req, res) => {
  console.log(`Route: ${req.method} ${req.originalUrl}`);
  res.status(200).send({
    message: "Shutting down the notification service...",
  });
  console.log("Shutting down the notification service...");
  task.stop();
});

app.get("/healthCheck", (req, res) => {
  res.status(200).send("Notification service is up and running...");
  console.log(`Route: ${req.method} ${req.originalUrl}`);
  console.log("user detected");
});

startCronService();

app.listen("8000", () => {
  console.log("Notification service open at port 8000");
});
