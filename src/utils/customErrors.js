class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
      super(message);
      this.statusCode = 401;
      this.name = 'UnauthorizedError';
  }
}

class ValidationError extends Error {
  constructor(errors) {
    super('Failed to validate user inputs')
    this.statusCode = 400;
    this.details = errors;
  }
}

class InvalidTokenError extends Error {
  constructor(message = 'Invalid or expired token. Please relog in and try again') {
    super(message);
    this.statusCode = 401;
  }
}

class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.statusCode = 404;
    this.name = 'NotFoundError'
  }
}

module.exports = { UnauthorizedError, ValidationError, InvalidTokenError, NotFoundError }
