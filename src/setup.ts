import fs from "fs";
import path from "path";

import sqlite3 from "sqlite3";
import Docker from "dockerode";

// make database if it doesn't exist
const db_file = path.join(__dirname, "./data/database.sqlite3");
if (!fs.existsSync(db_file)) {
  fs.openSync(db_file, "w");
  const db = new sqlite3.Database(db_file);
  db.run(
    'CREATE TABLE "volumes" ("id"	TEXT NOT NULL UNIQUE, "data"	JSON NOT NULL, PRIMARY KEY("id") );'
  );
  db.run(
    'CREATE TABLE "instances" ("id"	TEXT NOT NULL UNIQUE, "data"	JSON NOT NULL, PRIMARY KEY("id") );'
  );
}

export default {};