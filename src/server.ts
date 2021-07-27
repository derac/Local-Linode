import fs from "fs";
import path from "path";

import express from "express";
import sqlite3 from "sqlite3";

import types from "./routes/types";
import instances from "./routes/instances";
import volumes from "./routes/volumes";

const app = express();
const PersonalAccessToken = "testtokenabcdefg";

// make database if it doesn't exist
const db_file = path.join(__dirname, "./data/database.sqlite3");
if (!fs.existsSync(db_file)) {
  fs.openSync(db_file, "w");
  const db = new sqlite3.Database(db_file);
  db.run(
    'CREATE TABLE "volumes" ("id"	INTEGER NOT NULL UNIQUE, "data"	JSON NOT NULL, PRIMARY KEY("id" AUTOINCREMENT) );'
  );
  db.run(
    'CREATE TABLE "instances" ("id"	INTEGER NOT NULL UNIQUE, "data"	JSON NOT NULL, PRIMARY KEY("id" AUTOINCREMENT) );'
  );
}

app.use("/v4/linode/types", types);

// set up middleware for authorization, not needed for types API
app.use((req, res, next) => {
  if (!req.headers.authorization?.includes(PersonalAccessToken)) {
    return res.status(403).json({ errors: [{ reason: "Invalid Token" }] });
  }
  next();
});

app.use("/v4/linode/instances", instances);
app.use("/v4/volumes", volumes);

// ==== Start server =====
app.listen(3000, () => {
  console.log("The application is listening on port 3000!");
});
