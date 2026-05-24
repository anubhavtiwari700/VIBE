const mongoose = require('mongoose');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Database connected.');
        
        const email = 'user@vibe.com';
        const password = '000000';
        
        let existingUser = await User.findOne({ email });
        
        if (existingUser) {
            existingUser.password = password;
            await existingUser.save();
            console.log(`User ${email} password synchronized.`);
        } else {
            await User.create({
                name: 'Permanent User Node',
                email,
                password,
                role: 'user'
            });
            console.log(`User ${email} initialized successfully.`);
        }
        
        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error seeding user:', err);
        process.exit(1);
    }
};

seedUser();
