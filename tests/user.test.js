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
    it('create a new user', async() => {
        const res = await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'tester',
            password: '12345678',
            confirmPassword: '12345678'
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
            confirmPassword: 'random1234',
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
            username: 'TeStEr', // taken, case insensitive
            password: 'doesntmatter',
            confirmPassword: 'doesntmatter'
        })
        .expect(400)
    })

    it('returns error if passwords don\'t match', async() => {
        await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'lolz',
            password: '12345678',
            confirmPassword: 'somethingelse'
        })
        .expect(400)
    })

    it('returns error on invalid username or password', async() => {
        await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'invalid username',
            password: '12345678',
            confirmPassword: '12345678'
        })
        .expect(400)

        await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'valid',
            password: 'not',
            confirmPassword: 'not'
        })
        .expect(400)
    })
})

describe('user login', () => {
    it('logins user with valid credentials and returns jwt', async() => {
        await request(app)
        .post('/user/register')
        .expect('Content-Type', /json/)
        .send({
            username: 'testuser',
            password: '12345678',
            confirmPassword: '12345678'
        })
        .expect(200);

        const res = await request(app)
        .post('/user/login')
        .expect('Content-Type', /json/)
        .send({
            username: 'TestUser', // case insensitive!
            password: '12345678'
        })
        .expect(200)

        expect(res.body).toHaveProperty('token'); // jwt
        expect(res.body.user).toHaveProperty('_id');
    })

    it('returns error if user not found or password invalid', async() => {
        await request(app)
        .post('/user/login')
        .send({
            username: 'idontexist',
            password: '12345678'
        })
        .expect(400)

        await request(app)
        .post('/user/login')
        .send({
            username: 'TESTER',
            password: 'notthepass'
        })
        .expect(400)
    })
})