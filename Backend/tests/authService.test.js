const mongoose = require("mongoose");
const authService = require("../services/authService");
const User = require("../models/User");

// Mock email service
jest.mock("../services/emailService", () => ({
  generateOTP: jest.fn(() => "123456"),
  sendOTPEmail: jest.fn(() => Promise.resolve(true)),
  sendWelcomeEmail: jest.fn(() => Promise.resolve(true)),
}));

describe("AuthService", () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(
      process.env.MONGODB_URI_TEST ||
        "mongodb://localhost:27017/eventspark-test"
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear database before each test
    await User.deleteMany({});
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      const result = await authService.registerUser(userData);

      expect(result.success).toBe(true);
      expect(result.message).toBe("User registered successfully");
      expect(result.data.user.name).toBe(userData.name);
      expect(result.data.user.email).toBe(userData.email);
      expect(result.data.token).toBeDefined();
    });

    it("should throw error if user already exists", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      // Register user first time
      await authService.registerUser(userData);

      // Try to register same user again
      await expect(authService.registerUser(userData)).rejects.toThrow(
        "User with this email already exists"
      );
    });
  });

  describe("loginUser", () => {
    it("should login user successfully with correct credentials", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      // Register user first
      await authService.registerUser(userData);

      // Login user
      const result = await authService.loginUser(
        "john@example.com",
        "password123"
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Login successful");
      expect(result.data.user.email).toBe("john@example.com");
      expect(result.data.token).toBeDefined();
    });

    it("should throw error with incorrect password", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      // Register user first
      await authService.registerUser(userData);

      // Try to login with wrong password
      await expect(
        authService.loginUser("john@example.com", "wrongpassword")
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error with non-existent email", async () => {
      await expect(
        authService.loginUser("nonexistent@example.com", "password123")
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("forgotPassword", () => {
    it("should send OTP for existing user", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      // Register user first
      await authService.registerUser(userData);

      // Request password reset
      const result = await authService.forgotPassword("john@example.com");

      expect(result.success).toBe(true);
      expect(result.message).toBe("OTP sent to your email successfully");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        authService.forgotPassword("nonexistent@example.com")
      ).rejects.toThrow("User with this email does not exist");
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid OTP", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      // Register user first
      await authService.registerUser(userData);

      // Request password reset
      await authService.forgotPassword("john@example.com");

      // Reset password with OTP
      const result = await authService.resetPassword(
        "john@example.com",
        "123456",
        "newpassword123"
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Password reset successfully");
    });

    it("should throw error with invalid OTP", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phoneNumber: "+1234567890",
      };

      // Register user first
      await authService.registerUser(userData);

      // Request password reset
      await authService.forgotPassword("john@example.com");

      // Try to reset with wrong OTP
      await expect(
        authService.resetPassword(
          "john@example.com",
          "000000",
          "newpassword123"
        )
      ).rejects.toThrow("Invalid OTP");
    });
  });
});
