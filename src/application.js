const fs = require("fs");
const path = require("path");

const express = require("express");
const bodyparser = require("body-parser");
const helmet = require("helmet");
const cors = require("cors");

const app = express();

const db = require("./db");

const user_events = require("./routes/users_events");
const user = require("./routes/user");
const board = require("./routes/board");
const login = require("./routes/login");
const register = require("./routes/register");
const reset = require("./routes/reset");
const verifyToken = require("./validate-token");
// const days = require("./routes/days");
// const appointments = require("./routes/appointments");
// const interviewers = require("./routes/interviewers");

function read(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      file,
      {
        encoding: "utf-8"
      },
      (error, data) => {
        if (error) return reject(error);
        resolve(data);
      }
    );
  });
}

module.exports = function application(
  ENV,
  actions = { updateAppointment: () => {} }
) {
  app.use(cors());
  app.use(helmet());
  app.use(bodyparser.json());
  app.use(express.json());

  // public
  app.use("/api/login", login(db));
  app.use("/api/register", register(db));

  if (ENV === "development" || ENV === "test") {
    Promise.all([
      read(path.resolve(__dirname, `db/schema/create.sql`)),
      read(path.resolve(__dirname, `db/schema/${ENV}.sql`))
    ])
      .then(([create, seed]) => {
        app.use("/api/debug", reset(db, create, seed));
      })
      .catch((error) => {
        console.log(`Error setting up the reset route: ${error}`);
      });
  }

  // protected
  app.use("/api/events", verifyToken, user_events(db));
  app.use("/api/board", verifyToken, board(db));
  app.use("/api/user", verifyToken, user(db));

  app.close = function () {
    return db.end();
  };

  return app;
};
