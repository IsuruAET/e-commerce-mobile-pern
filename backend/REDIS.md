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

---

## 🚀 Install Redis on Windows using WSL2 + Ubuntu (with Auto Start)

This guide will help you set up Redis on a Windows machine using WSL2 + Ubuntu, and configure it to auto-start every time your system boots.

---

## 🛠 Step-by-Step Installation Guide

### 1. Enable WSL & Install Ubuntu

1. Open **PowerShell as Administrator** and run:

   ```powershell
   wsl --install
   ```

   This installs **WSL2 with Ubuntu as the default Linux distribution**.

2. **Restart your computer** when prompted.

3. After restart, if Ubuntu is not installed automatically:

   - Open **Microsoft Store**
   - Search for `Ubuntu` (e.g., **Ubuntu 22.04**)
   - Click **Install**

4. **Launch Ubuntu** from the Start Menu.

5. On first run:
   - Ubuntu will **provision itself** (this may take a few minutes).
   - You'll be **prompted to create a Linux username and password**.

---

### 2. Update Ubuntu & Install Redis

Inside the Ubuntu terminal, run:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install redis -y
```

---

### 3. Start Redis & Verify

Start the Redis service:

```bash
sudo service redis-server start
```

Test that Redis is working:

```bash
redis-cli ping
```

You should see:

```
PONG
```

---

### 4. Auto-Start Redis on Ubuntu Boot

To make Redis start automatically when Ubuntu launches:

```bash
sudo systemctl enable redis-server
```

---

### 5. Auto-Start Ubuntu on Windows Boot (Optional)

To make Ubuntu start every time Windows starts, create a scheduled task:

1. Open **Task Scheduler** in Windows.
2. Click **Create Task**.
3. Under the **General** tab:
   - Name: `Start Ubuntu WSL`
   - Check **"Run whether user is logged in or not"**
   - Check **"Run with highest privileges"**
4. Go to **Triggers** tab → New → Begin task: **At startup**
5. Go to **Actions** tab → New →
   - Action: **Start a program**
   - Program/script: `wsl`
   - Add arguments: `-d Ubuntu`
6. Click OK and enter your password when prompted.

Now WSL (Ubuntu) will launch on boot, and Redis will start automatically.

---

### 💡 Optional: Limit WSL Resource Usage

To prevent WSL from consuming too much memory:

1. Create a `.wslconfig` file in:  
   `C:\Users\<YourUsername>\.wslconfig`

2. Add this content:

   ```ini
   [wsl2]
   memory=2GB
   processors=2
   ```

3. Apply the change by running:

   ```powershell
   wsl --shutdown
   ```

4. Launch Ubuntu again.

---

## ✅ Common Redis Commands

| Command                             | Description            |
| ----------------------------------- | ---------------------- |
| `sudo service redis-server start`   | Start Redis manually   |
| `sudo service redis-server stop`    | Stop Redis             |
| `sudo service redis-server restart` | Restart Redis          |
| `redis-cli ping`                    | Check Redis connection |
| `redis-cli`                         | Open Redis CLI         |

---

## 🔗 Helpful Links

- [Redis Documentation](https://redis.io/docs/)
- [WSL Official Guide](https://learn.microsoft.com/en-us/windows/wsl/)
- [Ubuntu on Microsoft Store](https://apps.microsoft.com/store/detail/ubuntu-2204/9PN20MSR04DW)

---

🎉 You’re all set! Redis will now auto-start on system boot through Ubuntu on WSL2. Happy developing!
