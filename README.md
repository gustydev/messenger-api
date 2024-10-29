# Messenger API
This is the back-end of [ZipZap](https://github.com/gustydev/zipzap). It is a RESTful API made in Express and NodeJs with a database in MongoDB, intended for a simple messaging app with user authentication/authorization, creation of chats, posting of attachments and messages, updating user profiles, demo account feature and more.

## Features
1. CRUD operations of users, messages and chats on a MongoDB database
2. Authentication and authorization of users using JWTs
3. Real-time features such as updating user status and chats with Socket.io
4. Custom middlewares for token validation (authorization) and demo account access control
5. Custom errors for validation, authorization and others
6. Integration tests using Supertest and Jest
7. Uploading files to Cloudinary via Multer
8. Validation and sanitization of user inputs using bcrypt and Express Validator

## Installation

1. **Clone the repository**:
    ```bash
    git clone https://github.com/gustydev/messenger-api.git
    ```

2. **Navigate to the project directory**:
    ```bash
    cd messenger-api
    ```

3. **Install dependencies and run the app**:
    ```bash
    npm install
    npm run dev
    ```

## Setup
The app requires, at the very least, a MongoDB database to run. For attachments, a Cloudinary account is also necessary.

### Environment Variables
The app requires some environment variables set on a .env file on the root directory:

```plaintext
DATABASE_URL=mongo_db_url
TEST_DATABASE_URL=test_db_url
CLOUDINARY_URL=cloudinary_url
SECRET=secret_key
```

## API Endpoints

### User Routes

These routes handle user-related operations, such as registration, login, and account management.

- `POST /user/register` - Register a new user.
- `POST /user/login` - Log in an existing user.
- `GET /user/list` - Get a list of all users.
- `GET /user/:userId` - Retrieve details for a specific user.
- `PUT /user/:userId` - Update user details, protected by `validateToken` and `checkIfDemo`.
- `DELETE /user/:userId` - Delete a user account, protected by `validateToken` and `checkIfDemo`.

### Chat Routes

These routes handle chat-related operations, such as retrieving chat details, sending messages, and managing members.

- `GET /chat/list` - Retrieve a list of chats for the authenticated user, protected by `validateToken`.
- `GET /chat/:chatId` - Retrieve details for a specific chat, protected by `validateToken`.
- `GET /chat/:chatId/messages` - Get messages within a specific chat, protected by `validateToken`.
- `GET /chat/:chatId/members` - Retrieve members of a specific chat, protected by `validateToken`.
- `GET /chat/dm/:recipientId` - Get or create a direct message (DM) chat with a specific user, protected by `validateToken`.
- `POST /chat/:chatId/message` - Send a new message to a specific chat, protected by `validateToken`.
- `PUT /chat/:chatId` - Update a specific chat, protected by `validateToken`.
- `POST /chat` - Create a new chat, protected by `validateToken` and `checkIfDemo`.