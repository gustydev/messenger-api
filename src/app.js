require('dotenv').config();
const express = require('express');
const app = express();
const createError = require('http-errors');
const cors = require('cors');
const User = require('./models/user')
const Message = require('./models/message')
const Chat = require('./models/chat')
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const passport = require('passport');
const userRoute = require('./routes/user')
const chatRoute = require('./routes/chat')

const mongoose = require('mongoose');
mongoose.set('strictQuery', 'false')

const databaseUrl = process.env.DATABASE_URL;

main()
.then(async() => {
  // await Chat.deleteMany();
  // await Message.deleteMany();
  // await User.deleteMany();
})
.catch((err) => console.log(err));

async function main() {
  await mongoose.connect(databaseUrl);
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

app.get('/', (req, res) => {
    res.send('hi there :>')
})

app.use('/user', userRoute)
app.use('/chat', chatRoute)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    err
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {console.log(`App listening on port ${port}`)})