# Prisma Commands and Workflows

## 1. After Schema Changes

When you make changes to `schema.prisma`, follow these steps:

### Development Environment

```bash
# 1. Generate Prisma Client (updates types)
npx prisma generate

# 2. Create and apply migration
npx prisma migrate dev --name <migration_name>
# Example:
# npx prisma migrate dev --name add_user_phone_and_role
```

### Production Environment

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Apply migrations
npx prisma migrate deploy
```

## 2. Reset Database and Migrations

If you need to completely reset your database and migrations:

### Option 1: Reset with Migrations

```bash
# 1. Drop the database
npx prisma migrate reset

# 2. Reapply all migrations
npx prisma migrate deploy
```

### Option 2: Fresh Start (Delete all migrations)

```bash
# 1. Delete all migration files
rm -rf prisma/migrations/*

# 2. Drop the database
npx prisma migrate reset

# 3. Create initial migration
npx prisma migrate dev --name init

# 4. Apply the migration
npx prisma migrate deploy
```

## Important Notes

- Always backup your database before running reset commands
- `migrate reset` will delete all data in your database
- `migrate dev` is for development only
- `migrate deploy` is for production environments
- Keep your migration files in version control
- Never delete migration files in production

## Common Issues and Solutions

1. **Migration Conflicts**

   ```bash
   # If you have conflicts in migrations
   npx prisma migrate reset
   npx prisma migrate dev
   ```

2. **Database Connection Issues**

   ```bash
   # Check your database connection
   npx prisma db push
   ```

3. **View Current Migration Status**

   ```bash
   npx prisma migrate status
   ```

4. **Generate Prisma Client Only**
   ```bash
   npx prisma generate
   ```

Remember to always test migrations in a development environment before applying them to production.
