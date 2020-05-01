module.exports = function (app, db) {
  const passport = require("passport");
  const bcrypt = require("bcrypt");

  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/");
  }

  app.route("/").get((req, res) => {
    res.render(process.cwd() + "/views/pug/index", {
      title: "Home Page",
      message: "Please login",
      showLogin: true,
      showRegistration: true,
    });
  });

  app
    .route("/login")
    .post(
      passport.authenticate("local", { failureRedirect: "/" }),
      (req, res) => {
        res.redirect("/profile");
      }
    );

  app.route("/profile").get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + "/views/pug/profile", {
      username: req.user.username,
    });
  });

  app.route("/logout").get((req, res) => {
    req.logout();
    res.redirect("/");
  });

  app.route("/register").post(
    (req, res, next) => {
      db.collection("users").findOne(
        { username: req.body.username },
        (err, user) => {
          if (err) next(err);
          if (user) return res.redirect("/");

          let hash = bcrypt.hashSync(req.body.password, 12);

          db.collection("users").insertOne(
            {
              username: req.body.username,
              password: hash,
            },
            (err, doc) => {
              if (err) next(err);
              next(null, doc);
            }
          );
        }
      );
    },
    passport.authenticate("local", { failureRedirect: "/" }),
    (req, res, next) => {
      res.redirect("/profile");
    }
  );
};
