const { app, request, connectDB, disconnectDB, clearDB, userRegister, userLogin } = require('./setup');

const User = require('../src/models/user');

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
    it('create a new valid user', async() => {
        const res = await userRegister({
            username: 'tester',
            password: '12345678',
            confirmPassword: '12345678'
        }, 200)

        expect(res.body.user.displayName).toEqual('tester') // not setting display name = same as username
        expect(res.body.user).toHaveProperty('_id'); // means it got saved in database
    }),

    it('create new user with custom display name', async() => {
        const res = await userRegister({
            username: 'lorem',
            password: 'random1234',
            confirmPassword: 'random1234',
            displayName: 'ipsum dolor'
        }, 200)

        expect(res.body.user.displayName).toEqual('ipsum dolor')
    })

    it('rejects taken username', async() => {
        await userRegister({
            username: 'TeStEr', // taken, case insensitive
            password: 'doesntmatter',
            confirmPassword: 'doesntmatter'
        }, 400)
    })

    it('returns error if passwords don\'t match', async() => {
        await userRegister({
            username: 'lolz',
            password: '12345678',
            confirmPassword: 'somethingelse'
        }, 400)
    })

    it('returns error on invalid username or password', async() => {
        await userRegister({
            username: 'invalid username', // has spaces
            password: '12345678',
            confirmPassword: '12345678'
        }, 400)

        await userRegister({
            username: 'valid',
            password: 'not', // too short
            confirmPassword: 'not'
        }, 400)

        // username is not a string
        await userRegister({
            username: false,
            password: '12345678',
            confirmPassword: '12345678'
        }, 400)

        // password is not a string
        await userRegister({
            username: 'valid',
            password: 12345678,
            confirmPassword: '12345678'
        }, 400)
    })
})

describe('user login', () => {
    it('logins user with valid credentials and returns jwt', async() => {
        await userRegister({
            username: 'testuser',
            password: '12345678',
            confirmPassword: '12345678'
        }, 200)

        const res = await userLogin({
            username: 'TestUser', // case insensitive!
            password: '12345678'
        }, 200)

        expect(res.body).toHaveProperty('token'); // jwt
        expect(res.body.user).toHaveProperty('_id');
    })

    it('returns errors if user not found or wrong password)', async() => {
        await userLogin({
            username: 'idontexist',
            password: '12345678'
        }, 400)

        await userLogin({
            username: 'TESTER',
            password: 'notthepass'
        }, 400)
    })
})