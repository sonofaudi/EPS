const mongoose = require('mongoose');
const Student = require('./models/Candidate'); // Points to models/Candidate.js
const Admin = require('./models/Admin');       // Points to models/Admin.js

const seedData = async () => {
    try {
        // Diagnostic check to catch empty model exports instantly
        if (typeof Admin !== 'function' || !Admin.deleteMany) {
            throw new TypeError("The Admin module was imported but it is not registered as a valid Mongoose model. Check your server/models/Admin.js export.");
        }
        if (typeof Student !== 'function' || !Student.deleteMany) {
            throw new TypeError("The Student module was imported but it is not registered as a valid Mongoose model. Check your server/models/Candidate.js export.");
        }

        // Connect to local MongoDB instance
        await mongoose.connect('mongodb://127.0.0.1:27017/kasuProctoring');
        console.log("Connected to MongoDB for seeding...");

        // 1. Clear existing test data to clear out duplicates cleanly
        await Student.deleteMany({});
        await Admin.deleteMany({});
        console.log("🧹 Cleaned out stale collections...");

        // 2. Insert a valid Admin matching your frontend configuration
        const testAdmin = new Admin({
            email: "admin@gmail.com",
            fullName: "Dev Audi",
            password: "Password123"
        });
        await testAdmin.save();
        console.log("✅ Test Admin record seeded successfully!");

        // 3. Insert a valid Student/Candidate for testing the client portal later
        const testStudent = new Student({
            email: "student@gmail.com",
            fullName: "Glad Candidate",
            matricNumber: "KASU/22/CSC/1125",
            faculty: "Science",
            department: "Computer Science",
            level: "400",
            examId: "CSC405",
            isAllowed: true
        });
        await testStudent.save();
        console.log("✅ Test Student record seeded successfully!");

        // Close connection safely
        await mongoose.connection.close();
        console.log("\n🎉 Database seeding run complete. Ready for interface login testing.");

    } catch (error) {
        console.error("❌ Error seeding database:", error.message || error);
        // Ensure connection drops even on a failure loop run
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
};

seedData();
