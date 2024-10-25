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

async function userRegister(data, status) {
    return await request(app)
    .post('/user/register')
    .expect('Content-Type', /json/)
    .send(data)
    .expect(status)
}

async function userLogin(data, status) {
    return await request(app)
    .post('/user/login')
    .expect('Content-Type', /json/)
    .send(data)
    .expect(status)
}

app.use((err, req, res, next) => {
    if (err.name === 'CastError') {
        return res.status(400).json({ err: {msg: 'Invalid ID format', statusCode: 400} });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({ err: {msg: 'Validation failed', errors: err.errors, statusCode: 400} });
    }
    next(err);
  });

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    const error = {
      statusCode,
      message,
      ...err
    };
    console.log(error)
    res.status(statusCode).json(error)
  });

module.exports = {
    app,
    request,
    connectDB,
    disconnectDB,
    clearDB,
    userRegister,
    userLogin
};