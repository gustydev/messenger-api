const { app, request, connectDB, disconnectDB, clearDB } = require('./setup');

const User = require('../src/models/user')

beforeAll(async() => {
    await connectDB();
    await clearDB(User);
});

afterAll(async() => {
    await clearDB(User);
    await disconnectDB()
})

describe('get user', () => {
    it('respond with user get', function(done) {
        request(app)
        .get('/user/')
        .expect('Content-Type', /json/)
        .expect({ msg: 'user get'})
        .expect(200, done)
    })
})

describe('user register', () => {
    it('return status 400 on invalid user inputs', function(done) {
        request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'not valid',
            password: '2short'
        })
        .expect(400, done)
    }),

    it('create a new user', async() => {
        const res = await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'tester',
            password: '12345678'
        })
        .expect(200);

        expect(res.body.user.displayName).toEqual('tester') // not setting display name = same as username
        expect(res.body.user).toHaveProperty('_id'); // means it got saved in database
    }),

    it('create new user with custom display name', async() => {
        const res = await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'lorem',
            password: 'random1234',
            displayName: 'ipsum dolor'
        })
        .expect(200);

        expect(res.body.user.displayName).toEqual('ipsum dolor')
    })

    it('rejects taken username', async() => {
        await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'tester', // taken
            password: 'doesntmatter'
        })
        .expect(400)
    })
})