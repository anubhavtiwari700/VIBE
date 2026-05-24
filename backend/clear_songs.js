const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const clearDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB at ' + process.env.MONGO_URI);
        
        // Find the Song collection dynamically
        const collections = await mongoose.connection.db.listCollections().toArray();
        const hasSongs = collections.some(c => c.name === 'songs');
        
        if (hasSongs) {
            await mongoose.connection.db.collection('songs').deleteMany({});
            console.log('✅ All song documents have been deleted.');
        } else {
            console.log('No songs collection found.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error.message);
        process.exit(1);
    }
};

clearDB();
