// auth-service.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require("dotenv").config();
const mongodbUrl = process.env.MONGODB_URL;
if (!mongodbUrl) {
  throw new Error("MongoDB URI is not defined in the environment variables.");
}

mongoose.connect(mongodbUrl);

const userSchema = new Schema({
  userName: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  loginHistory: [
    {
      dateTime: { type: Date, required: true },
      userAgent: { type: String, required: true },
    },
  ],
});

let User;

function Initialize() {
  return new Promise(function (resolve, reject) {
    mongoose.connection.on("error", (err) => {
      reject(err);
    });

    mongoose.connection.once("open", () => {
      User = mongoose.model("users", userSchema);
      resolve();
    });
  });
}

function registerUser(userData) {
  return new Promise(async function (resolve, reject) {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
      let newUser = new User(userData);
      try {
        await newUser.save();
        resolve();
      } catch (err) {
        if (err.code === 11000) {
          reject("User Name already taken");
        } else {
          reject(`There was an error creating the user: ${err}`);
        }
      }
    }
  });
}

async function checkUser(userData) {
  try {
    const user = await User.findOneAndUpdate(
      { userName: userData.userName, password: userData.password },
      {
        $push: {
          loginHistory: {
            $each: [
              {
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              },
            ],
            $position: 0,
            $slice: 8,
          },
        },
      },
      { new: true }
    );

    if (!user) {
      throw new Error(
        `Unable to find user or incorrect password for user: ${userData.userName}`
      );
    }

    return user;
  } catch (err) {
    console.error("Error checking user:", err);
    throw new Error(`Error checking user: ${err.message}`);
  }
}

module.exports = { Initialize, registerUser, checkUser, userSchema };
