 
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Grab the URI string directly from your hidden environment variables
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`=========================================`);
        console.log(`✨ MongoDB Connected Successfully!`);
        console.log(`📡 Host: ${conn.connection.host}`);
        console.log(`🗃️ Database Name: ${conn.connection.name}`);
        console.log(`=========================================`);
    } catch (error) {
        console.error(`❌ Database Connection Failure: ${error.message}`);
        // Exit system process with failure code (1) to prevent unstable operations
        process.exit(1);
    }
};

module.exports = connectDB;