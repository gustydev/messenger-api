require('dotenv').config()
const user = require('../src/routes/user');
const userModel = require('../src/models/user')
const request = require("supertest");
const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/", user);

const mongoose = require('mongoose');
mongoose.set('strictQuery', 'false')

const databaseUrl = process.env.TEST_DATABASE_URL;

main()
.catch((err) => console.log(err));

async function main() {
  await mongoose.connect(databaseUrl);
}

beforeAll(async() => {
    await userModel.deleteMany() // clean database before tests
});

afterAll(async() => {
    await mongoose.disconnect();
})

describe('get user', () => {
    it('respond with user get', function(done) {
        request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect({ msg: 'user get'})
        .expect(200, done)
    })
})

describe('user register', () => {
    it('return status 400 on invalid user inputs', function(done) {
        request(app)
        .post('/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'not valid',
            password: '2short',
            email: 'notanemail',
        })
        .expect(400, done)
    }),

    it('create a new user', async() => {
        const res = await request(app)
        .post('/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'tester',
            password: '12345678',
            email: "address@email.com"
        })
        .expect(200);

        expect(res.body.user.displayName).toEqual('tester') // not setting display name = same as username
        expect(res.body.user).toHaveProperty('_id'); // means it got saved in database
    })

    it('rejects taken username or email', async() => {
        await request(app)
        .post('/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'tester', // taken
            password: 'doesntmatter',
            email: 'different@email.com'
        })
        .expect(400)

        await request(app)
        .post('/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'different',
            password: 'doesntmatter',
            email: 'address@email.com' // taken
        })
        .expect(400)
    })
})