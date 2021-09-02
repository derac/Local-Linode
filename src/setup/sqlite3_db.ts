import path from "path";
import sqlite3 from "sqlite3";

// make database if it doesn't exist
const db_file = path.join(__dirname, "..", "data", "database.sqlite3");
const db = new sqlite3.Database(db_file);

db.run(
  "CREATE TABLE IF NOT EXISTS volumes (id text PRIMARY KEY, data json NOT NULL );"
);
db.run(
  "CREATE TABLE IF NOT EXISTS instances (id text PRIMARY KEY, data json NOT NULL, disks json NOT NULL, configs json NOT NULL, current_config text NOT NULL);"
);

export { db };
