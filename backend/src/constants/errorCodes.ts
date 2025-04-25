export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  RATE_LIMIT = "RATE_LIMIT",
  INTERNAL = "INTERNAL",
  SECURITY = "SECURITY",
}

export enum ErrorCode {
  // Validation Errors (400)
  INVALID_INPUT = "INVALID_INPUT",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  INVALID_TOKEN = "INVALID_TOKEN",
  INVALID_REFRESH_TOKEN = "INVALID_REFRESH_TOKEN",
  INVALID_RESET_TOKEN = "INVALID_RESET_TOKEN",
  INVALID_PASSWORD_CREATION_TOKEN = "INVALID_PASSWORD_CREATION_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_NOT_FOUND = "TOKEN_NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_USER_DATA = "INVALID_USER_DATA",
  PASSWORD_ALREADY_SET = "PASSWORD_ALREADY_SET",
  PASSWORD_NOT_SET = "PASSWORD_NOT_SET",
  SOCIAL_AUTH_REQUIRED = "SOCIAL_AUTH_REQUIRED",

  // Authentication Errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",
  ACCOUNT_DEACTIVATED = "ACCOUNT_DEACTIVATED",

  // Authorization Errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Security Errors (403)
  CSRF_TOKEN_MISSING = "CSRF_TOKEN_MISSING",
  CSRF_TOKEN_INVALID = "CSRF_TOKEN_INVALID",
  CSRF_TOKEN_MISMATCH = "CSRF_TOKEN_MISMATCH",

  // Not Found Errors (404)
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",

  // Timeout Errors (408)
  OPERATION_TIMEOUT = "OPERATION_TIMEOUT",

  // Conflict Errors (409)
  EMAIL_EXISTS = "EMAIL_EXISTS",
  UNIQUE_CONSTRAINT_VIOLATION = "UNIQUE_CONSTRAINT_VIOLATION",
  FOREIGN_KEY_CONSTRAINT_VIOLATION = "FOREIGN_KEY_CONSTRAINT_VIOLATION",
  USER_HAS_APPOINTMENTS = "USER_HAS_APPOINTMENTS",

  // Rate Limit Errors (429)
  TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
  TOO_MANY_PASSWORD_ATTEMPTS = "TOO_MANY_PASSWORD_ATTEMPTS",

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
  [ErrorCode.INVALID_PASSWORD_CREATION_TOKEN]:
    "This password creation link has expired or is invalid. Please request a new one.",
  [ErrorCode.TOKEN_EXPIRED]: "The token has expired. Please request a new one.",
  [ErrorCode.TOKEN_NOT_FOUND]:
    "We couldn't find your request. Please try again.",
  [ErrorCode.VALIDATION_ERROR]: "Please check your input and try again.",
  [ErrorCode.INVALID_USER_DATA]:
    "The information provided is not valid. Please check and try again.",
  [ErrorCode.PASSWORD_ALREADY_SET]:
    "Password has already been set for this account",
  [ErrorCode.PASSWORD_NOT_SET]:
    "Your account has been created but you need to set your password. Please check your email for the password creation link or request a new one.",
  [ErrorCode.SOCIAL_AUTH_REQUIRED]:
    "Please use social authentication to access your account.",

  // Authentication Errors
  [ErrorCode.UNAUTHORIZED]: "You need to be logged in to do that.",
  [ErrorCode.AUTHENTICATION_FAILED]:
    "We couldn't verify your identity. Please try again.",
  [ErrorCode.ACCOUNT_DEACTIVATED]:
    "This account has been deactivated. Please contact support for assistance.",

  // Authorization Errors
  [ErrorCode.FORBIDDEN]: "You don't have permission to do that.",
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    "You don't have sufficient permissions to perform this action.",

  // Security Errors
  [ErrorCode.CSRF_TOKEN_MISSING]:
    "CSRF token is missing. Please refresh the page and try again.",
  [ErrorCode.CSRF_TOKEN_INVALID]:
    "Invalid CSRF token. Please refresh the page and try again.",
  [ErrorCode.CSRF_TOKEN_MISMATCH]:
    "CSRF token mismatch. Please refresh the page and try again.",

  // Not Found Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: "We couldn't find what you're looking for.",
  [ErrorCode.USER_NOT_FOUND]: "User not found.",

  // Timeout Errors
  [ErrorCode.OPERATION_TIMEOUT]: "The operation timed out. Please try again.",

  // Conflict Errors
  [ErrorCode.EMAIL_EXISTS]:
    "This email is already registered. Please try logging in or use a different email.",
  [ErrorCode.UNIQUE_CONSTRAINT_VIOLATION]:
    "This value already exists. Please use a different one.",
  [ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION]:
    "A foreign key constraint was violated. Please check your input and try again.",
  [ErrorCode.USER_HAS_APPOINTMENTS]:
    "Cannot delete user. User has active appointments as either a client or stylist.",

  // Rate Limit Errors
  [ErrorCode.TOO_MANY_REQUESTS]: "Too many requests. Please try again later.",
  [ErrorCode.TOO_MANY_PASSWORD_ATTEMPTS]:
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
  [ErrorCode.INVALID_PASSWORD_CREATION_TOKEN]: 400,
  [ErrorCode.TOKEN_EXPIRED]: 400,
  [ErrorCode.TOKEN_NOT_FOUND]: 400,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_USER_DATA]: 400,
  [ErrorCode.PASSWORD_ALREADY_SET]: 400,
  [ErrorCode.PASSWORD_NOT_SET]: 400,
  [ErrorCode.SOCIAL_AUTH_REQUIRED]: 400,

  // Authentication Errors
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.AUTHENTICATION_FAILED]: 401,
  [ErrorCode.ACCOUNT_DEACTIVATED]: 401,

  // Authorization Errors
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  // Security Errors
  [ErrorCode.CSRF_TOKEN_MISSING]: 403,
  [ErrorCode.CSRF_TOKEN_INVALID]: 403,
  [ErrorCode.CSRF_TOKEN_MISMATCH]: 403,

  // Not Found Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,

  // Timeout Errors
  [ErrorCode.OPERATION_TIMEOUT]: 408,

  // Conflict Errors
  [ErrorCode.EMAIL_EXISTS]: 409,
  [ErrorCode.UNIQUE_CONSTRAINT_VIOLATION]: 409,
  [ErrorCode.FOREIGN_KEY_CONSTRAINT_VIOLATION]: 409,
  [ErrorCode.USER_HAS_APPOINTMENTS]: 409,

  // Rate Limit Errors
  [ErrorCode.TOO_MANY_REQUESTS]: 429,
  [ErrorCode.TOO_MANY_PASSWORD_ATTEMPTS]: 429,

  // Internal Server Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
};
