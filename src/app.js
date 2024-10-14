require('dotenv').config();
const express = require('express');
const { createServer } = require('node:http');
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
const { Server } = require('socket.io');

const server = createServer(app);

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

const io = new Server(server);
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
    res.send('hi there :>') // later replace with readme.md or similar view
})

io.on('connection', async(socket) => {
  const userId = socket.handshake.query.userId;

  await User.findByIdAndUpdate(userId, { status: 'Online'}, {new: true})
  .then((user) => console.log(`@${user.username} is ${user.status}`))

  socket.on('disconnect', async() => {
    await User.findByIdAndUpdate(userId, { status: 'Offline'}, {new: true})
    .then((user) => console.log(`@${user.username} is ${user.status}`))
  }); 
});

app.use('/user', userRoute)
app.use('/chat', chatRoute)

// Catch common mongoose errors
app.use((err, req, res, next) => {
  if (err.name === 'CastError') {
      return res.status(400).json({ err: {msg: 'Invalid ID format', statusCode: 400} });
  }
  if (err.name === 'ValidationError') {
      return res.status(400).json({ err: {msg: 'Validation failed', errors: err.errors, statusCode: 400} });
  }
  next(err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Global error handler
app.use((err, req, res, next) => {
  // console.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const error = {
    statusCode,
    message,
    ...err
  };

  res.status(statusCode).json(error)
});

const port = process.env.PORT || 3000;
server.listen(port, () => {console.log(`Server running on port ${port}`)})