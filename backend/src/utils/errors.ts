export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource Conflict') {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error') {
    super(message, 500, false);
  }
}

export class AiConversationNotFoundError extends NotFoundError {
  constructor(message = 'AI Conversation not found or access denied') {
    super(message);
  }
}

export class AiMessageNotFoundError extends NotFoundError {
  constructor(message = 'AI Message not found') {
    super(message);
  }
}

export class AiAttachmentNotFoundError extends NotFoundError {
  constructor(message = 'AI Attachment not found') {
    super(message);
  }
}

export class AiFlashcardNotFoundError extends NotFoundError {
  constructor(message = 'AI Flashcard not found') {
    super(message);
  }
}

export class RepositoryError extends AppError {
  constructor(message = 'Database Repository Operation Failed') {
    super(message, 500);
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database Connection or Transaction Failure') {
    super(message, 500);
  }
}

