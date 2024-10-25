const { app, request, connectDB, disconnectDB, clearDB } = require('./setup');
const { userLogin, userRegister, userUpdate, userDelete, uploadPFP, createChat, postMessage } = require('./requests');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
    secure: true
});

const User = require('../src/models/user');
const Message = require('../src/models/message');
const Chat = require('../src/models/chat');

let updatedUser;
let auth;
let id;
let smarty; // second user used for deletion tests
const imageIds = []; // Array of Cloudinary public image IDs to clean up after tests

beforeAll(async () => {
    await connectDB();
    await clearDB(User);

    await userRegister(
        { username: 'UpdateMe', password: '12345678', confirmPassword: '12345678' },
        200
    );

    const res = await userLogin(
        { username: 'UpdateMe', password: '12345678' },
        200
    );
    updatedUser = res.body.user;
    id = updatedUser._id;

    auth = `Bearer ${res.body.token}`;

    await userRegister({ username: 'smarty', password: '12345678', confirmPassword: '12345678' }, 200);
    const res2 = await userLogin({ username: 'smarty', password: '12345678' }, 200);

    smarty = res2.body;
});

afterAll(async () => {
    if (imageIds.length > 0) {
        await cloudinary.api.delete_resources(imageIds);
    }

    await clearDB(User);
    await disconnectDB();
});

describe('get user', () => {
    it('respond with user get', function (done) {
        request(app)
            .get('/user/')
            .expect('Content-Type', /json/)
            .expect({ msg: 'user get' })
            .expect(200, done);
    });
});

describe('user register', () => {
    it('create a new valid user', async () => {
        const res = await userRegister(
            { username: 'tester', password: '12345678', confirmPassword: '12345678' },
            200
        );

        expect(res.body.user.displayName).toEqual('tester'); // Not setting display name = same as username
        expect(res.body.user).toHaveProperty('_id'); // Means it got saved in database
    });

    it('create new user with custom display name', async () => {
        const res = await userRegister(
            { username: 'lorem', password: 'random1234', confirmPassword: 'random1234', displayName: 'ipsum dolor' },
            200
        );

        expect(res.body.user.displayName).toEqual('ipsum dolor');
    });

    it('rejects taken username', async () => {
        await userRegister(
            { username: 'TeStEr', password: 'doesntmatter', confirmPassword: 'doesntmatter' },
            400
        );
    });

    it("returns error if passwords don't match", async () => {
        await userRegister(
            { username: 'lolz', password: '12345678', confirmPassword: 'somethingelse' },
            400
        );
    });

    it('returns error on invalid username or password', async () => {
        await userRegister(
            { username: 'invalid username', password: '12345678', confirmPassword: '12345678' },
            400
        );

        await userRegister(
            { username: 'valid', password: 'not', confirmPassword: 'not' },
            400
        );

        await userRegister(
            { username: false, password: '12345678', confirmPassword: '12345678' },
            400
        );

        await userRegister(
            { username: 'valid', password: 12345678, confirmPassword: '12345678' },
            400
        );
    });
});

describe('user login', () => {
    it('logins user with valid credentials and returns jwt', async () => {
        await userRegister(
            { username: 'testuser', password: '12345678', confirmPassword: '12345678' },
            200
        );

        const res = await userLogin(
            { username: 'TestUser', password: '12345678' },
            200
        );

        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('_id');
    });

    it('returns errors if user not found or wrong password', async () => {
        await userLogin(
            { username: 'idontexist', password: '12345678' },
            400
        );

        await userLogin(
            { username: 'TESTER', password: 'notthepass' },
            400
        );
    });
});

describe('update user', () => {
    it('updates user profile with valid data', async () => {
        const res = await userUpdate(
            { displayName: 'Edited Guy', bio: 'Test text' },
            200,
            auth,
            id
        );

        expect(res.body.user.displayName).toEqual('Edited Guy');
        expect(res.body.user.bio).toEqual('Test text');

        const res2 = await userUpdate(
            { displayName: 'Different Name' },
            200,
            auth,
            id
        );

        expect(res2.body.user.displayName).toEqual('Different Name');
        expect(res2.body.user.bio).toEqual('Test text');
    });

    it('rejects update if token is invalid', async () => {
        await userUpdate(
            { displayName: 'something else' },
            401,
            'Bearer notatoken'
        );
    });

    it('rejects updating profile of different user', async () => {
        await userRegister(
            { username: 'evilguy', password: 'thedevil666', confirmPassword: 'thedevil666' },
            200
        );
        const res = await userLogin(
            { username: 'evilguy', password: 'thedevil666' },
            200
        );

        await userUpdate(
            { displayName: 'ha ha ha', bio: 'spam spam spam' },
            403,
            `Bearer ${res.body.token}`,
            id
        );
    });

    it('rejects updating with invalid inputs', async () => {
        await userUpdate(
            { displayName: 'a' },
            400,
            auth,
            id
        );

        await userUpdate(
            { displayName: 'lorem ipsum dolor sit amet consectetur adpiscing elit etc etc' },
            400,
            auth,
            id
        );

        await userUpdate(
            { bio: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium q' },
            400,
            auth,
            id
        );
    });
});

describe('uploading profile picture', () => {
    it('update profile picture with valid image file', async () => {
        const res = await uploadPFP('public/images/banana.jpg', 200, auth, id);

        const pfpUrl = res.body.user.profilePicUrl;
        expect(pfpUrl).toBeTruthy();

        imageIds.push(res.body.imgId);
    });

    it('rejects uploading non image', async () => {
        await uploadPFP('public/árvore.txt', 400, auth, id);
    });

    it('rejects uploading pics larger than 3MB', async () => {
        const res = await uploadPFP('public/images/bananas.jpg', 500, auth, id);
        expect(res.body.code).toEqual('LIMIT_FILE_SIZE');
    });

    it('accepts gif uploads', async () => {
        const res = await uploadPFP('public/images/catJAM.gif', 200, auth, id);
        imageIds.push(res.body.imgId);
    });
});

describe('user delete', () => {
    it('rejects deleting different user', async () => {
        await userDelete(403, `Bearer ${smarty.token}`, id);
    });

    it('deletes user and any associated data', async () => {
        // First, create some chats and some messages
        const c1 = await createChat({title: 'random title'}, 200, auth);
        const c2 = await createChat({dm: true, recipient: smarty.user._id}, 200, auth)

        await postMessage({content: 'AAAAA'}, 200, c1.body.chat._id, auth)
        await postMessage({content: 'BBBBB'}, 200, c2.body.chat._id, auth)

        // then delete the user
        const res = await userDelete(200, auth, id);
        
        // returns the deleted user data
        expect(res.body.user._id).toBeDefined();
        expect(res.body.msg).toBe('User deleted');

        const [userDMs, chatsWithUser, userMessages] = await Promise.all([
            Chat.find({ dm: true, 'members.member': res.body.user._id }),
            Chat.find({ 'members.member': res.body.user._id }),
            Message.find({ postedBy: res.body.user._id })
        ]);

        expect(userDMs).toStrictEqual([]); // no dm's with the user should be found
        expect(chatsWithUser).toStrictEqual([]); // no chat member lists should have them either
        expect(userMessages).toStrictEqual([]); // and no messages posted by them should exist
    });

    it('rejects deleting with invalid token', async () => {
        await userDelete(401, 'Bearer notatoken');
    });
});
