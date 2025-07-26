# EventSpark Authentication Backend - Express.js

This is the Express.js version of the EventSpark Authentication Backend, providing user authentication and authorization services.

## Features

- **User Registration**: Sign up with name, email, password, and phone number
- **User Login**: Sign in with email and password
- **Password Reset**: Forgot password with OTP email verification
- **JWT Authentication**: Secure token-based authentication
- **Email Integration**: Nodemailer for sending OTP and welcome emails
- **MongoDB Integration**: Mongoose for data persistence
- **Input Validation**: Express-validator for request validation
- **Security**: Helmet.js for security headers, bcrypt for password hashing
- **Logging**: Morgan for HTTP request logging

## API Endpoints

### POST `/api/auth/signup`

Register a new user.

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+1234567890"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### POST `/api/auth/signin`

Login user.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

### POST `/api/auth/forgot-password`

Send OTP to user's email for password reset.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "OTP sent to your email successfully"
}
```

### POST `/api/auth/reset-password`

Reset password using OTP.

**Request Body:**

```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

### GET `/api/auth/profile`

Get user profile (requires authentication).

**Headers:**

```
Authorization: Bearer jwt_token_here
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phoneNumber": "+1234567890",
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### GET `/api/health`

Health check endpoint.

**Response:**

```
EventSpark Auth Backend is running!
```

## Setup

### Prerequisites

- Node.js 18 or higher
- npm
- MongoDB (local or cloud)
- Gmail account for sending emails

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file based on `env.example`:

```bash
cp env.example .env
```

3. Configure environment variables in `.env`:

```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/eventspark
JWT_SECRET=your-super-secret-jwt-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

4. Start the development server:

```bash
npm run dev
```

5. Start the production server:

```bash
npm start
```

### Testing

Run tests:

```bash
npm test
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASSWORD` - Gmail app password (not regular password)

## Email Configuration

To use Gmail for sending emails:

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password
3. Use the App Password in the `EMAIL_PASSWORD` environment variable

## CORS Configuration

The backend is configured to accept requests from:

- `https://event-spark-self.vercel.app`
- `https://event-spark-prod.vercel.app`
- `http://localhost:3000`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- Security headers with Helmet.js
- CORS protection
- Rate limiting (can be added)

## Database Schema

### User Model

```javascript
{
  name: String (required, 2-50 chars),
  email: String (required, unique, validated),
  password: String (required, min 6 chars, hashed),
  phoneNumber: String (required, validated),
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isEmailVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```
