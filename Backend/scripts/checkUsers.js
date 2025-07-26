require("dotenv").config();
const mongoose = require("mongoose");

// Connect to your specific database
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/eventspark-dev";

async function checkUsers() {
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

    // Get total count
    const totalUsers = await usersCollection.countDocuments();
    console.log(`Total users in collection: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log("No users found in the collection.");
      return;
    }

    // Get a sample user to see the structure
    const sampleUser = await usersCollection.findOne({});
    console.log("\nSample user structure:");
    console.log(JSON.stringify(sampleUser, null, 2));

    // Check for specific fields
    const usersWithPassword = await usersCollection.countDocuments({
      password: { $exists: true },
    });
    const usersWithEmail = await usersCollection.countDocuments({
      email: { $exists: true },
    });
    const usersWithName = await usersCollection.countDocuments({
      name: { $exists: true },
    });
    const usersWithPhone = await usersCollection.countDocuments({
      phoneNumber: { $exists: true },
    });

    console.log("\nField analysis:");
    console.log(
      `Users with password field: ${usersWithPassword}/${totalUsers}`
    );
    console.log(`Users with email field: ${usersWithEmail}/${totalUsers}`);
    console.log(`Users with name field: ${usersWithName}/${totalUsers}`);
    console.log(
      `Users with phoneNumber field: ${usersWithPhone}/${totalUsers}`
    );

    // List all unique field names in the collection
    const pipeline = [
      { $sample: { size: Math.min(100, totalUsers) } },
      { $project: { arrayofkeyvalue: { $objectToArray: "$$ROOT" } } },
      { $unwind: "$arrayofkeyvalue" },
      { $group: { _id: null, allkeys: { $addToSet: "$arrayofkeyvalue.k" } } },
    ];

    const result = await usersCollection.aggregate(pipeline).toArray();
    if (result.length > 0) {
      console.log("\nAll fields found in users collection:");
      result[0].allkeys.sort().forEach((field) => {
        console.log(`- ${field}`);
      });
    }
  } catch (error) {
    console.error("Error checking users:", error.message);
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
    console.log("\nDatabase connection closed");
  }
}

// Run the check
checkUsers();
