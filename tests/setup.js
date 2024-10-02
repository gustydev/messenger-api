require('dotenv').config()
const express = require("express");
const app = express();
const request = require('supertest')

// routes
const user = require('../src/routes/user');

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/user", user);

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