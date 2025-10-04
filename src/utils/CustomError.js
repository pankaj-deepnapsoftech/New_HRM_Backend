import { StatusCodes } from "http-status-codes";


export class CustomError extends Error {
    constructor(message, comingFrom) {
        super(message)
        this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        this.status = "error";
        this.comingFrom = comingFrom;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CustomError);
        };
    };

    serializeErrors() {
        return {
            message: this.message,
            statusCode: this.statusCode,
            status: this.status,
            comingFrom: this.comingFrom,
        };
    }

}



export class BadRequestError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.BAD_REQUEST;
  }
}

export class NotFoundError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.NOT_FOUND;
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.UNAUTHORIZED;
  }
}

export class ForbiddenError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.FORBIDDEN;
  }
}

export class InternalServerError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  }
}

export class ServiceUnavailableError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.SERVICE_UNAVAILABLE;
  }
}

export class GatewayTimeoutError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.GATEWAY_TIMEOUT;
  }
}

export class ConflictError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.CONFLICT;
  }
}

export class UnprocessableEntityError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  }
}

export class TooManyRequestsError extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.TOO_MANY_REQUESTS;
  }
}

export class NotImplemented extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.NOT_IMPLEMENTED;
  }
}

export class BadGateway extends CustomError {
  constructor(message, comingFrom) {
    super(message, comingFrom);
    this.statusCode = StatusCodes.BAD_GATEWAY;
  }
}



