class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
      super(message);
      this.statusCode = 401;
      this.name = 'UnauthorizedError';
  }
}

class ValidationError extends Error {
  constructor(errors) {
    let fields = [];

    errors.forEach((e) => {
      fields.push(e.path)
    }) 

    super(`Failed to validate user inputs (${fields.join(', ')})`)
    this.statusCode = 400;
    this.details = errors;
  }
}

class InvalidTokenError extends Error {
  constructor(message = 'Invalid or expired token') {
    super(message);
    this.statusCode = 401;
    this.msg = message;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
    this.name = 'NotFoundError'
    this.msg = message.message || 'Not found'
  }
}

module.exports = { UnauthorizedError, ValidationError, InvalidTokenError, NotFoundError }
