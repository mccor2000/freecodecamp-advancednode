"use strict";

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const fccTesting = require("./freeCodeCamp/fcctesting.js");
const auth = require("./app/auth.js");
const routes = require("./app/routes.js");
const mongo = require("mongodb").MongoClient;
const passport = require("passport");
const cookieParser = require("cookie-parser");
const app = express();
const http = require("http").Server(app);
const sessionStore = new session.MemoryStore();
require("dotenv").config();

const io = require("socket.io")(http);
const passportSocketIo = require("passport.socketio");

fccTesting(app); //For FCC testing purposes

app.use("/public", express.static(process.cwd() + "/public"));
app.use(cookieParser());
const cors = require("cors");
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    key: "express.sid",
    store: sessionStore,
  })
);

mongo.connect(
  process.env.DATABASE,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err, client) => {
    if (err) console.log("Database error: " + err);

    const db = client.db("passport");
    auth(app, db);
    routes(app, db);

    http.listen(process.env.PORT || 3000);

    //start socket.io code
    io.use(
      passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: "express.sid",
        secret: process.env.SESSION_SECRET,
        store: sessionStore,
      })
    );

    let currentUsers = 0;
    io.on("connection", (socket) => {
      console.log(`User ${socket.request.user.email} has connected`);
      ++currentUsers;
      io.emit("user count", currentUsers);

      socket.on("disconnect", () => {
        console.log(`User ${socket.request.user.email} has disconnected`);
        --currentUsers;
        io.emit("user count", currentUsers);
      });
    });
    //end socket.io code
  }
);
