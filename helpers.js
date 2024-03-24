import { db } from "./database.js";
import nodemailer from "nodemailer";
import { readFile, writeFile } from "fs/promises";

let lastRunTimestamp = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));



export const queryAsync = (sql, values) => {
  try {
    return new Promise((resolve, reject) => {
      db.query(sql, values, (err, results) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  } catch (error) {
    console.log(error);
  }
};

export const readfile = async (filePath) => {
  try {
    const data = await readFile(filePath, "utf8");
    return data;
  } catch (error) {
    console.log(error);
  }
};

export const sendEmail = async (address, subject, text) => {
  try {
    console.log("Sending email...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "domservices98@gmail.com",
        pass: "uuea iipm bgld fjhx",
      },
    });

    let mailOptions = {
      from: "alexzormelo9@gmail.com",
      to: address,
      subject: subject,
      html: text,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Email sent .... " + info.response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAllData = async () => {
  try {
    const currentTimestamp = new Date();

    const getAllTelevision = `SELECT * FROM mr_TVstory WHERE createDate > "${lastRunTimestamp.toISOString()}"`;
    const getAllPrint = `SELECT * FROM mr_printMedia WHERE createDate > "${lastRunTimestamp.toISOString()}"`;
    const getAllWeb = `SELECT * FROM mr_webMedia WHERE createDate > "${lastRunTimestamp.toISOString()}"`;
    const getAllRadio = `SELECT * FROM mr_radioStory WHERE createDate > "${lastRunTimestamp.toISOString()}"`;

    const television = await queryAsync(getAllTelevision);
    const print = await queryAsync(getAllPrint);
    const web = await queryAsync(getAllWeb);
    const radio = await queryAsync(getAllRadio);

    lastRunTimestamp = currentTimestamp

    return {
      television,
      print,
      web,
      radio,
    };
  } catch (error) {
    console.log(error);
  }
};

export const getAllClients = async () => {
  try {
    const getAllClients = `SELECT c.uid, c.username, c.email, c.phone, c.contactPerson, p.keywords, c.expiryDate, c.status 
        FROM mr_clients c
        JOIN mr_newsPreferences p 
        ON c.uid = p.uid
        WHERE p.email = 1`;
    const clients = await queryAsync(getAllClients);
    // console.log(clients)
    return clients;
  } catch (error) {
    console.log(error);
  }
};

export const hasSimilarElements = async (array1, array2) => {
  // Convert arrays to sets to easily check for existence
  const set1 = new Set(array1.map((element) => element.trim().toLowerCase()));
  const set2 = new Set(array2.map((element) => element.trim().toLowerCase()));

  // Iterate over elements in set1 and check if they exist in set2
  for (let element of set1) {
    if (set2.has(element)) {
      return true; // Found a similar element
    }
  }

  // No similar elements found
  return false;
};

export const getScheduleTime = async () => {
  const data = await readFile("./schedule.txt", "utf8");
  const lines = data.split("\n");
  let first, second;
  lines.forEach((line) => {
    if (line.includes("first")) {
      first = line.split("=")[1].trim();
    } else if (line.includes("second")) {
      second = line.split("=")[1].trim();
    }
  });
  return {
    first,
    second,
  };
};

export const setScheduleTime = async (newFirst, newSecond) => {
  const data = await readFile("./schedule.txt", "utf8");
  // console.log(newFirst, newSecond)
  const updatedContent = data
    .replace(/first\s*=\s*\d+/, `first=${newFirst}`)
    .replace(/second\s*=\s*\d+/, `second=${newSecond}`);
    // console.log(updatedContent)

  await writeFile("schedule.txt", updatedContent, "utf8")
};
