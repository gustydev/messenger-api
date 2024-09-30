require('dotenv').config();
const express = require('express');
const app = express();
const createError = require('http-errors');
const cors = require('cors');
const User = require('./models/user')

const mongoose = require('mongoose');
mongoose.set('strictQuery', 'false')

const mongoDB = process.env.MONGODB_URI;

main()
.then(async() => {
    await User.deleteMany();

    const test = new User({
    username: 'gusty',
    password: 'bad12345',
    email: "lol@lol.co"
    });

    await test.save();
    console.log(test)
})
.catch((err) => console.log(err));

async function main() {
  await mongoose.connect(mongoDB);
}

const corsOptions = {
  // In production, use the front-end URL; in development, accept any
  origin: (process.env.NODE_ENV === 'production') ? process.env.FRONTEND_URL : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.send('hi there :>')
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Global error handler
app.use((err, req, res, next) => {
  console.log(err)
  const statusCode = err.statusCode || 500;
  const error = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error,
    statusCode
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {console.log(`App listening on port ${port}`)})