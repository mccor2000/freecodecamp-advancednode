"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const session = require("express-session");

const passport = require("passport");
const mongo = require("mongodb").MongoClient;

const routes = require("./routes.js");
const auth = require("./auth.js");

const app = express();
require("dotenv").config();

fccTesting(app); //For FCC testing purposes
app.use("/public", express.static(process.cwd() + "/public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "pug");

app.use(
  session({
    secret: "abc",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongo.connect(
  process.env.DATABASE,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) {
      console.log("Database error: " + err);
    } else {
      console.log("Successful database connection");
      const db = client.db("passport");

      auth(app, db);
      routes(app, db);

      app.use((req, res, next) => {
        res.status(404).type("text").send("Not Found");
      });

      app.listen(process.env.PORT || 3000, () => {
        console.log("Listening on port " + process.env.PORT);
      });
    }
  }
);
