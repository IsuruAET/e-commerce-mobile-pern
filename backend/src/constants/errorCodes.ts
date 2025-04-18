export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  INTERNAL = "INTERNAL",
}

export enum ErrorCode {
  // Validation Errors (400-499)
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  INVALID_TOKEN = "INVALID_TOKEN",
  INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
  INVALID_RESET_TOKEN = "INVALID_RESET_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_USER_DATA = "INVALID_USER_DATA",

  // Authentication Errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",

  // Authorization Errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Not Found Errors (404)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",

  // Conflict Errors (409)
  EMAIL_EXISTS = "EMAIL_EXISTS",
  UNIQUE_CONSTRAINT_VIOLATION = "UNIQUE_CONSTRAINT_VIOLATION",
  FOREIGN_KEY_CONSTRAINT_VIOLATION = "FOREIGN_KEY_CONSTRAINT_VIOLATION",

  // Rate Limit Errors (429)
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  TOO_MANY_RESET_ATTEMPTS = "TOO_MANY_RESET_ATTEMPTS",

  // Internal Server Errors (500)
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

type ErrorMessages = {
  [key in ErrorCode]: string;
};

export const ERROR_MESSAGES: ErrorMessages = {
  // Validation Errors
  [ErrorCode.INVALID_INPUT]:
    "The input provided is invalid. Please check and try again.",
  [ErrorCode.INVALID_CREDENTIALS]:
    "The email or password you entered is incorrect. Please try again.",
  [ErrorCode.INVALID_TOKEN]: "The token provided is invalid.",
  [ErrorCode.INVALID_REFRESH_TOKEN]:
    "Your session has expired. Please log in again.",
  [ErrorCode.INVALID_RESET_TOKEN]:
    "This password reset link has expired or is invalid. Please request a new one.",
  [ErrorCode.TOKEN_EXPIRED]: "The token has expired. Please request a new one.",
  [ErrorCode.TOKEN_NOT_FOUND]:
    "We couldn't find your request. Please try again.",
  [ErrorCode.VALIDATION_ERROR]: "Please check your input and try again.",
  [ErrorCode.INVALID_USER_DATA]:
    "The information provided is not valid. Please check and try again.",

  // Authentication Errors
  [ErrorCode.UNAUTHORIZED]: "You need to be logged in to do that.",
  [ErrorCode.AUTHENTICATION_FAILED]:
    "We couldn't verify your identity. Please try again.",

  // Authorization Errors
  [ErrorCode.FORBIDDEN]: "You don't have permission to do that.",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    "You don't have sufficient permissions to perform this action.",

  // Not Found Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: "We couldn't find what you're looking for.",
  [ErrorCode.USER_NOT_FOUND]: "User not found.",

  // Conflict Errors
  [ErrorCode.EMAIL_EXISTS]:
    "This email is already registered. Please try logging in or use a different email.",
  [ErrorCode.UNIQUE_CONSTRAINT_VIOLATION]:
    "This value already exists. Please use a different one.",
  [ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION]:
    "A foreign key constraint was violated. Please check your input and try again.",

  // Rate Limit Errors
  [ErrorCode.TOO_MANY_REQUESTS]: "Too many requests. Please try again later.",
  [ErrorCode.TOO_MANY_RESET_ATTEMPTS]:
    "You've tried too many times. Please wait a while before trying again.",

  // Internal Server Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]:
    "Something went wrong on our end. Please try again later.",
  [ErrorCode.DATABASE_ERROR]:
    "A database error occurred. Please try again later.",
};

type ErrorStatusCodes = {
  [key in ErrorCode]: number;
};

export const ERROR_STATUS_CODES: ErrorStatusCodes = {
  // Validation Errors
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.INVALID_CREDENTIALS]: 400,
  [ErrorCode.INVALID_TOKEN]: 400,
  [ErrorCode.INVALID_REFRESH_TOKEN]: 400,
  [ErrorCode.INVALID_RESET_TOKEN]: 400,
  [ErrorCode.TOKEN_EXPIRED]: 400,
  [ErrorCode.TOKEN_NOT_FOUND]: 400,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_USER_DATA]: 400,

  // Authentication Errors
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.AUTHENTICATION_FAILED]: 401,

  // Authorization Errors
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  // Not Found Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,

  // Conflict Errors
  [ErrorCode.EMAIL_EXISTS]: 409,
  [ErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 409,
  [ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION]: 409,

  // Rate Limit Errors
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.TOO_MANY_RESET_ATTEMPTS]: 429,

  // Internal Server Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
};
