import express from "express";
import cors from "cors";
import cron from "node-cron";
import { db } from "./database.js";
import {
  getAllClients,
  getAllData,
  hasSimilarElements,
  queryAsync,
  readfile,
  sendEmail,
} from "./helpers.js";
const app = express();

let num = 1;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const connection = db.getConnection((err, connection) => {
  if (!err) return console.log("Database connected...");
  return console.log("Database couldn't connect...", err);
});

const layout = `<div class='article shadow_secondary Z7rPmDxqE9F5ybL3'><h2>{TITLE}</h2><p>{SUMMARY}</p><p class='author'>Author: {AUTHOR}</p><a href='{URL}' class='button btn-gradient' target='_blank'>See More</a></div>`;

let newString = "";

const setUpMail = async (story) => {
  // console.log(story)
  let modified = layout.replace("{TITLE}", story.title);
  modified = modified.replace("{SUMMARY}", story.summary);
  modified = modified.replace("{AUTHOR}", "Dodzi");
  modified = modified.replace("{URL}", story.mid);
  newString = newString + modified;
};

const finalizeMail = async (newString, name) => {
  const file = await readfile("./mail.txt");
  //   console.log(newString)
  let finalResult = file.replace("{STORYMESSAGE}", newString);
  finalResult = finalResult.replace("{RECIPIENTNAME}", name);
  //   console.log(finalResult);
  return finalResult;
  //   console.log(finalResult)
};

const allClients = await getAllClients();
const alldata = await getAllData(2);
// console.log(alldata)
// console.log(allClients)

const handleProcessData = async (alldata, keywords) => {
  if (alldata.length) {
    for (const data of alldata) {
      const dataKeywords = data.keywords.split(",");
      const hasSimilarElement = await hasSimilarElements(
        keywords,
        dataKeywords
      );
      if (hasSimilarElement) {
        await setUpMail(data);
        // console.log("found similar");
      }
    }
  }
};

const handleMailService = async () => {
  try {
    for (const client of allClients) {
      const keywords = client.keywords.split(",");

      await handleProcessData(alldata.television, keywords);
      await handleProcessData(alldata.print, keywords);
      await handleProcessData(alldata.web, keywords);
      await handleProcessData(alldata.radio, keywords);

      if (newString.includes("Z7rPmDxqE9F5ybL3")) {
        const final = await finalizeMail(newString, client.username);
        console.log("found");
        // console.log(final);
        const mail = await sendEmail(
          "alexzormelo9@gmail.com",
          "MediaRev Notification Report",
          final
        );
        newString = "";
      } else {
        console.log("not found");
      }
    }
  } catch (error) {
    console.log(error);
  }
};

const task = cron.schedule(
  "10 * * * * * ",
  () => {
    console.log(`running task ${num}`);
    handleMailService();
    num += 1;
  },
  {
    scheduled: false,
  }
);

app.get("/", (req, res) => {
  console.log(`Route: ${req.method} ${req.originalUrl}`);
  res.status(200).send({
    message: "Starting up the notification service...",
  });
  console.log("Starting up the notification service...");
  task.start();
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

app.listen("8000", () => {
  console.log("Notification service open at port 8000");
});
