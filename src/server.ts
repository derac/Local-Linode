import express from "express";

import types from "./routes/types";
import instances from "./routes/instances";
import volumes from "./routes/volumes";

// run setup code
import "./setup";

const app = express();
const PersonalAccessToken = "testtokenabcdefg";

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
