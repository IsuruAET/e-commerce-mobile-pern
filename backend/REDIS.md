# Redis Documentation

## Overview

This project uses Redis for token management, particularly for handling refresh tokens, password reset tokens, and password creation tokens.

## Token Types

The system manages three types of tokens:

- Refresh Tokens (7 days expiry)
- Password Reset Tokens (1 hour expiry)
- Password Creation Tokens (24 hours expiry)

## Key Prefixes

Each token type has a specific prefix in Redis:

- Refresh Tokens: `refresh_token:`
- Password Reset Tokens: `password_reset_token:`
- Password Creation Tokens: `password_creation_token:`

## Redis CLI Commands

### 1. List All Tokens

To list all tokens of a specific type:

```bash
# List all refresh tokens
KEYS refresh_token:*

# List all password reset tokens
KEYS password_reset_token:*

# List all password creation tokens
KEYS password_creation_token:*
```

### 2. Check Token Value

To check the value (user ID) associated with a token:

```bash
GET refresh_token:YOUR_TOKEN_HERE
```

### 3. Check Token TTL

To check the remaining time-to-live of a token:

```bash
TTL refresh_token:YOUR_TOKEN_HERE
```

### 4. Scan Tokens

To scan through all tokens (useful for large datasets):

```bash
SCAN 0 MATCH refresh_token:*
```

### 5. Clear Cache

To clear Redis cache, you have several options:

```bash
# From within Redis CLI
# First enter Redis CLI:
redis-cli

# Then use these commands:
KEYS refresh_token:*
# For each key returned, use:
DEL key_name

# Or use this simpler method to clear all data:
FLUSHALL

# Clear only the current database
FLUSHDB
```

⚠️ **Warning**: These commands will permanently delete data. Make sure to:

- Back up important data before clearing
- Verify you're clearing the correct environment
- Use with caution in production environments

## Token Management

### Refresh Tokens

- Prefix: `refresh_token:`
- Default Expiry: 7 days
- Value: User ID
- Used for maintaining user sessions

### Password Reset Tokens

- Prefix: `password_reset_token:`
- Default Expiry: 1 hour
- Value: User ID
- Used for password reset functionality

### Password Creation Tokens

- Prefix: `password_creation_token:`
- Default Expiry: 24 hours
- Value: User ID
- Used for new user password creation

## Implementation Details

The token management is handled by the `RedisTokenService` class, which provides methods for:

- Setting tokens
- Getting token values
- Refreshing tokens
- Deleting tokens
- Checking token TTL

## Security Considerations

- Tokens are automatically expired after their TTL
- Each token is associated with a specific user ID
- Tokens are invalidated on logout
- Multiple tokens can exist for a single user
