require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Connect to your specific database
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/eventspark-dev";

async function migrateUsers() {
  try {
    console.log("Connecting to MongoDB...");
    console.log("Using URI:", MONGODB_URI.replace(/\/\/.*@/, "//***:***@")); // Hide credentials in logs

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully");

    // Get the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Find all users without password field
    const usersWithoutPassword = await usersCollection
      .find({
        password: { $exists: false },
      })
      .toArray();

    console.log(
      `Found ${usersWithoutPassword.length} users without password field`
    );

    if (usersWithoutPassword.length === 0) {
      console.log(
        "All users already have password fields. No migration needed."
      );
      return;
    }

    // Generate a default password for each user
    const defaultPassword = "changeme123"; // Users should change this
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Update each user
    for (const user of usersWithoutPassword) {
      await usersCollection.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null,
            isEmailVerified: false,
          },
        }
      );
      console.log(`Updated user: ${user.email || user.name || user._id}`);
    }

    console.log("Migration completed successfully!");
    console.log(
      'IMPORTANT: All users now have a default password: "changeme123"'
    );
    console.log(
      "Users should be notified to change their passwords immediately."
    );
  } catch (error) {
    console.error("Migration failed:", error.message);
    if (error.message.includes("ECONNREFUSED")) {
      console.log(
        "\n💡 Tip: Make sure you have created a .env file with your MongoDB Atlas connection string:"
      );
      console.log(
        "MONGODB_URI=mongodb+srv://eventspark-admin:AN0FSNx0vmLnCJpN@eventspark-dev.iab8rnr.mongodb.net/eventspark-dev"
      );
    }
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the migration
migrateUsers();
