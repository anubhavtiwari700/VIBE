const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI not set in environment variables. Database will not connect.');
            return;
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Don't exit - let server stay up so we can see logs on Render
        console.error('Server will continue without database. Check MONGO_URI env var.');
    }
};

module.exports = connectDB;
