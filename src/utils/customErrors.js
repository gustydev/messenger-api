class UnauthorizedError extends Error {
    constructor(message) {
      super(message);
      this.statusCode = 401;
      this.name = 'UnauthorizedError'
      this.msg = message.message || 'Unauthorized'
    }
}

class InvalidInputError extends Error {
  constructor(message) {
    super(message)
    this.statusCode = 400;
    this.name = message.name || 'InvalidInputError' // Either "JsonWebTokenError" or the more generic "InvalidInputError"
    this.msg = message.errors || message.message; // Either the validation input errors array or the invalid token message
  }
}

module.exports = { UnauthorizedError, InvalidInputError }
