# Authentication Service Documentation

## Overview

The Authentication Service provides comprehensive user authentication and authorization functionality for the e-commerce platform. It handles user registration, login, token management, password reset, and social authentication (Google).

## Core Features

### 1. Token Management

- **Token Generation**: Creates JWT access and refresh tokens
  - Access Token: Valid for 15 minutes
  - Refresh Token: Valid for 7 days
- **Token Storage**: Securely stores refresh tokens in the database
- **Token Cleanup**: Automated cleanup of expired tokens
  - Runs every 24 hours by default
  - Removes both expired refresh tokens and password reset tokens

### 2. User Authentication

- **Login**

  - Email and password verification
  - Password hashing using bcrypt
  - Automatic cleanup of expired tokens before login
  - Returns access token, refresh token, and user details

- **Registration**

  - Email uniqueness validation
  - Password hashing
  - Automatic token generation
  - Returns access token, refresh token, and user details

- **Logout**
  - Removes refresh token from database

### 3. Token Refresh

- Validates existing refresh token
- Generates new access and refresh tokens
- Updates refresh token in database
- Handles token expiration and validation

### 4. Password Management

- **Forgot Password**

  - Rate limiting (max 3 attempts per 24 hours)
  - Generates secure reset token (valid for 1 hour)
  - Sends password reset email with secure link
  - Maintains security by not revealing user existence

- **Password Reset**
  - Validates reset token
  - Updates user password with new hashed password
  - Removes all existing reset tokens for the user
  - Implements secure token verification

### 5. Social Authentication

- **Google Authentication**
  - Handles Google OAuth callback
  - Stores refresh token
  - Returns access token, refresh token, and user details
  - Error handling for authentication failures

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Secure token storage in database
- Rate limiting for password reset attempts
- Automatic cleanup of expired tokens
- Secure password reset flow
- No user existence disclosure in password reset

## Error Handling

- Custom error handling through AppError class
- Proper error messages for various scenarios:
  - Invalid credentials
  - Email already exists
  - Invalid refresh token
  - Too many password reset attempts
  - Invalid or expired reset token

## Database Integration

- Uses Prisma ORM for database operations
- Maintains relationships between:
  - Users
  - Refresh Tokens
  - Password Reset Tokens

## Email Integration

- Sends password reset emails
- Professional email templates
- Secure reset links
- Clear instructions for users
