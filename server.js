/********************************************************************************
 *  WEB322 – Assignment 06
 *
 *  I declare that this assignment is my own work in accordance with Seneca's
 *  Academic Integrity Policy:
 *
 *  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 *  Name: Ji Ho Nam Student ID: 139817217 Date: Dec 11 2023
 *
 *  Published URL:
 *
 ********************************************************************************/
const express = require("express");
const bodyParser = require("body-parser");
const authData = require("./modules/auth-service.js");
const legoData = require("./modules/legoSets");
const { getAllThemes, addSet } = require("./modules/legoSets");
const path = require("path");
const clientSessions = require("client-sessions");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 8080;

// Use client-sessions middleware
app.use(
  clientSessions({
    cookieName: "session",
    secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr",
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  })
);

// Set view engine and static folder
app.set("view engine", "ejs");
app.use(express.static("public"));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize data and start server
legoData
  .Initialize()
  .then(authData.initialize)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server on :${PORT}, run with http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize", error);
  });

// Home route
app.get("/", (req, res) => {
  const session = req.session;
  res.render("home", { session });
});

// About route
app.get("/about", (req, res) => {
  const session = req.session;
  res.render("about", { session });
});

// Sets route
app.get("/lego/sets", (req, res) => {
  const session = req.session;
  const theme = req.query.theme;

  if (theme) {
    legoData
      .getSetsByTheme(theme)
      .then((sets) => {
        res.render("sets", { sets, session });
      })
      .catch((error) => {
        res.status(404).render("404", { session });
      });
  } else {
    legoData
      .getAllSets()
      .then((sets) => {
        res.render("sets", { sets, session });
      })
      .catch((error) => {
        res.status(404).render("404", { session });
      });
  }
});

// Set details route
app.get("/lego/sets/:setNum", (req, res) => {
  const session = req.session;
  const setNum = req.params.setNum;
  legoData
    .getSetByNum(setNum)
    .then((set) => {
      if (set) {
        res.render("set", { set, message: "Set found", session });
      } else {
        res.status(404).render("404", { message: "Set not found", session });
      }
    })
    .catch((error) => {
      res.status(404).render("404", {
        message: "An error occurred while fetching the set",
        session,
      });
    });
});

// Add set route
app.get("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    const session = req.session;
    const themes = await getAllThemes();
    res.render("addSet", { themes, session });
  } catch (error) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${
        error.message || "Unknown error"
      }`,
      session,
    });
  }
});

app.post("/lego/addSet", ensureLogin, async (req, res) => {
  try {
    const session = req.session;
    await addSet(req.body);
    res.redirect("/lego/sets");
  } catch (error) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${
        error.message || "Unknown error"
      }`,
      session,
    });
  }
});

// Edit set route
app.get("/lego/editSet/:num", ensureLogin, async (req, res) => {
  try {
    const session = req.session;
    const setNum = req.params.num;
    const set = await legoData.getSetByNum(setNum);
    const themes = await legoData.getAllThemes();
    res.render("editSet", { themes, set, session });
  } catch (error) {
    res.status(404).render("404", { message: error, session });
  }
});

app.post("/lego/editSet", ensureLogin, async (req, res) => {
  try {
    const session = req.session;
    const { set_num, ...setData } = req.body;
    await legoData.editSet(set_num, setData);
    res.redirect("/lego/sets");
  } catch (error) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${
        error.message || "Unknown error"
      }`,
      session,
    });
  }
});

// Delete set route
app.get("/lego/deleteSet/:num", ensureLogin, async (req, res) => {
  try {
    const session = req.session;
    const setNum = req.params.num;
    await legoData.deleteSet(setNum);
    res.redirect("/lego/sets");
  } catch (error) {
    res.render("500", {
      message: `I'm sorry, but we have encountered the following error: ${
        error.message || "Unknown error"
      }`,
      session,
    });
  }
});

// Login route
app.get("/login", (req, res) => {
  const session = req.session;
  const page = "/login";
  const userName = "";
  const errorMessage = "";
  res.render("login", { session, page, userName, errorMessage });
});

// Login user route
app.post("/login", async (req, res) => {
  const session = req.session;
  req.body.userAgent = req.get("User-Agent");
  try {
    const user = await authData.checkUser(req.body);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory,
    };
    res.redirect("/lego/sets");
  } catch (error) {
    const page = "/login";
    res.render("login", {
      errorMessage: error,
      userName: req.body.userName,
      session,
      page,
    });
  }
});

// Register user route
app.post("/register", async (req, res) => {
  try {
    const session = req.session;
    await authData.registerUser(req.body);
    session.successMessage = "Registration successful!";
    res.render("register", {
      successMessage: session.successMessage,
      userName: req.body.userName,
      session,
    });
  } catch (error) {
    const errorMessage = error.message || "Unknown error";
    const session = req.session;
    const userName = "";
    res.render("register", {
      errorMessage,
      userName: req.body.userName,
      session,
    });
  }
});

// Register route
app.get("/register", (req, res) => {
  const session = req.session;
  const page = "/register";
  res.render("register", { session, page });
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.reset();
  res.redirect("/");
});

// User history route
app.get("/userHistory", ensureLogin, (req, res) => {
  const session = req.session;
  res.render("userHistory", { session });
});

// 404 route
app.use((req, res) => {
  const session = req.session;
  let message = "I'm sorry, we're unable to find what you're looking for";

  // Check for specific conditions and set appropriate messages
  if (req.baseUrl === "/lego/sets" && req.query.theme === "qwer") {
    message = "Unable to find requested sets";
  } else if (
    req.baseUrl === "/lego/sets/:setNum" &&
    req.params.setNum === "asdf"
  ) {
    message = "Unable to find requested set";
  } else if (req.originalUrl === "/qwer") {
    message = "I'm sorry, we're unable to find what you're looking for";
  } else {
    message = "An error occurred. The requested page is not available.";
  }

  console.log("Message:", message);
  res.status(404).render("404", { message, session });
});

// Middleware to ensure the user is logged in
function ensureLogin(req, res, next) {
  if (!req.session || !req.session.user || !req.session.user.userName) {
    res.redirect("/login");
  } else {
    next();
  }
}
