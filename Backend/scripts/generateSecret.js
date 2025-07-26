const crypto = require("crypto");

// Generate a secure random secret key
const generateSecret = () => {
  // Generate 64 random bytes and convert to hex
  const secret = crypto.randomBytes(64).toString("hex");
  return secret;
};

// Generate multiple options
console.log("🔐 Secure JWT Secret Keys Generated:");
console.log("=====================================");
console.log("");

// Option 1: Simple hex string
const secret1 = generateSecret();
console.log("Option 1 (Recommended):");
console.log(secret1);
console.log("");

// Option 2: Base64 encoded
const secret2 = crypto.randomBytes(64).toString("base64");
console.log("Option 2 (Base64):");
console.log(secret2);
console.log("");

// Option 3: With special characters
const secret3 = crypto.randomBytes(48).toString("base64") + "!@#$%^&*()";
console.log("Option 3 (With special chars):");
console.log(secret3);
console.log("");

console.log("📝 Instructions:");
console.log("1. Copy one of the secrets above");
console.log("2. Add it to your .env file:");
console.log("   JWT_SECRET=your_secret_here");
console.log("3. Keep this secret secure and never share it!");
console.log("");
console.log("⚠️  Security Tips:");
console.log(
  "- Use a different secret for each environment (dev, staging, prod)"
);
console.log("- Make it at least 32 characters long");
console.log("- Include a mix of letters, numbers, and special characters");
console.log("- Store it securely and never commit to version control");
