require('dotenv').config()
const express = require("express");
const app = express();
const request = require('supertest')
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.SECRET,
  };
  
passport.use(
    new JwtStrategy(opts, async (payload, done) => {
    try {
        const user = await User.findById(payload.id)
        if (user) {
        return done(null, true)
        }
    } catch (error) {
        return done(error);
    }
    })
);

// routes
const userRoute = require('../src/routes/user');
const chatRoute = require('../src/routes/chat')

app.use("/user", userRoute);
app.use("/chat", chatRoute)

const mongoose = require('mongoose');
mongoose.set('strictQuery', 'false')

const databaseUrl = process.env.TEST_DATABASE_URL;

async function connectDB() {
  await mongoose.connect(databaseUrl);
}

async function disconnectDB() {
    await mongoose.disconnect();
}

async function clearDB(model) {
    await model.deleteMany(); // clears db of model used in test
}

module.exports = {
    app,
    request,
    connectDB,
    disconnectDB,
    clearDB
};