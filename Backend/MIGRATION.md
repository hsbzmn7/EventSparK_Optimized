# Database Migration Guide

This guide helps you migrate your existing users collection to include password fields for the authentication system.

## Prerequisites

1. Make sure you have MongoDB running
2. Set up your `.env` file with the correct database connection string
3. Install dependencies: `npm install`

## Step 1: Check Current User Structure

First, let's see what your current users collection looks like:

```bash
npm run check-users
```

This will show you:

- Total number of users
- Sample user structure
- Which fields already exist
- All field names in the collection

## Step 2: Run Migration

If you have users without password fields, run the migration:

```bash
npm run migrate
```

This will:

- Add a `password` field to all users without one
- Set a default password: `changeme123`
- Add `resetPasswordToken`, `resetPasswordExpires`, and `isEmailVerified` fields
- Hash the default password using bcrypt

## Step 3: Verify Migration

Run the check again to verify the migration worked:

```bash
npm run check-users
```

## Important Notes

### Default Password

- All users will get the default password: `changeme123`
- **Users must change this password immediately**
- Consider sending email notifications to users

### Required Fields

The migration adds these fields to existing users:

- `password` (hashed)
- `resetPasswordToken` (null)
- `resetPasswordExpires` (null)
- `isEmailVerified` (false)

### Database Connection

Make sure your `.env` file has the correct MongoDB URI:

```
MONGODB_URI=mongodb://localhost:27017/eventspark-dev
```

## Manual Migration (if needed)

If you prefer to manually update users, you can use MongoDB commands:

```javascript
// Connect to your database
use eventspark-dev

// Update all users without password field
db.users.updateMany(
  { password: { $exists: false } },
  {
    $set: {
      password: "hashed_password_here",
      resetPasswordToken: null,
      resetPasswordExpires: null,
      isEmailVerified: false
    }
  }
)
```

## Troubleshooting

### Connection Issues

- Check your MongoDB connection string
- Ensure MongoDB is running
- Verify network connectivity

### Permission Issues

- Make sure your MongoDB user has write permissions
- Check if the database and collection exist

### Field Conflicts

- If fields already exist, the migration will skip them
- Check the output for any warnings or errors

## Post-Migration Tasks

1. **Notify Users**: Send emails to users about the default password
2. **Force Password Change**: Implement a "change password on first login" feature
3. **Monitor Logs**: Watch for any authentication issues
4. **Test APIs**: Verify all authentication endpoints work correctly
