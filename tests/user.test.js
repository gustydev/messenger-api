const { app, request, connectDB, disconnectDB, clearDB, userRegister, userLogin } = require('./setup');

const User = require('../src/models/user');

let updatedUser;
let auth;

beforeAll(async() => {
    await connectDB();
    await clearDB(User);

    await userRegister({username: 'UpdateMe', password: '12345678', confirmPassword: '12345678'}, 200);

    const res = await userLogin({username: 'UpdateMe', password: '12345678'}, 200);
    updatedUser = res.body.user;
    auth = `Bearer ${res.body.token}`;
});

afterAll(async() => {
    await clearDB(User);
    await disconnectDB()
})

async function userUpdate(data, status, authorization = auth, userId = updatedUser._id) {
    return await request(app)
    .put(`/user/${userId}`)
    .expect('Content-Type', /json/)
    .set('Authorization', authorization)
    .send(data)
    .expect(status)
}

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

describe('update user', () => {
    it('updates user profile with valid data', async() => {
        const res = await userUpdate({
            displayName: 'Edited Guy',
            bio: 'Test text'
        }, 200)

        expect(res.body.user.displayName).toEqual('Edited Guy')
        expect(res.body.user.bio).toEqual('Test text')

        const res2 = await userUpdate({
            displayName: 'Different Name'
            // bio stays the same
        }, 200)

        expect(res2.body.user.displayName).toEqual('Different Name')
        expect(res2.body.user.bio).toEqual('Test text')
    })

    it('rejects update if token is invalid', async() => {
        await userUpdate({
            displayName: 'something else'
        }, 401, 'Bearer notatoken')
    })

    it('rejects updating profile of different user', async() => {
        await userRegister({username: 'evilguy', password: 'thedevil666', confirmPassword: 'thedevil666'}, 200);
        const res = await userLogin({username: 'evilguy', password: 'thedevil666'}, 200);

        await userUpdate({
            displayName: 'ha ha ha',
            bio: 'spam spam spam'
        }, 401, `Bearer ${res.body.token}`)
    })

    it('rejects updating with invalid inputs', async() => {
        await userUpdate({
            displayName: 'E' // too short
        }, 400);

        await userUpdate({
            displayName: 'lorem ipsum dolor sit amet consectetur adpiscing elit etc etc' // too long
        }, 400)

        await userUpdate({
            // bio is too long (200+ chars)
            bio: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium q'
        }, 400)
    })
})

describe('uploading profile picture', () => {
    it.only('upload profile picture with valid image file', async() => {
        const res = await request(app)
        .put(`/user/${updatedUser._id}`)
        .set('Authorization', auth)
        .attach('pic', 'public/images/banana.jpg') // JPG file with less than 3MB = valid
        .expect(200)

        expect(res.body.user.profilePicUrl).toBeTruthy();
    })
})