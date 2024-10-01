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

const mongoose = require('mongoose');
mongoose.set('strictQuery', 'false')

const databaseUrl = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

main()
.then(async() => {
    // await Message.deleteMany()
    // await User.deleteMany()
    // await Chat.deleteMany();

    // const gusty = new User({
    //   username: 'gusty',
    //   password: 'lol123456',
    //   email: "gusty@fakemail.org"
    // })
    // await gusty.save();

    // const ytsug = new User({
    //   username: 'gusty2',
    //   password: 'whotehfuckcares',
    //   email: 'gusty@fakemail.o'
    // })
    // await ytsug.save();

    // const chat = new Chat({title: 'testing', members: [gusty]})
    // await chat.save();

    // const message = new Message({
    //   content: 'hi there',
    //   postedBy: gusty,
    //   chat: chat
    // })
    
    // const message2 = new Message({
    //   attachmentUrl: 'randomurl.com',
    //   postedBy: gusty,
    //   chat: chat
    // })

    // const message3 = new Message({
    //   content: 'this one has both text and an attachment oooo',
    //   attachmentUrl: 'lol.org',
    //   postedBy: gusty,
    //   chat: chat
    // })
    
    // await message.save();
    // await message2.save()
    // await message3.save()

    // console.log(message, message2,message3)
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

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const error = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error,
    statusCode
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {console.log(`App listening on port ${port}`)})