const User = require('../models/User');
const Song = require('../models/Song');
const SUPER_EMAIL = 'super@vibecom';
const SUPER_PASSWORD = '0000000000'; // SuperCurator secure key (10 characters)
const SUPER_FIRST_NAME = 'Administrator';
const SUPER_LAST_NAME = 'System';

const USER_EMAIL = 'user@vibecom';
const USER_PASSWORD = '0000000000'; // Normal User key (Synchronized to 10 characters)
const USER_FIRST_NAME = 'Permanent';
const USER_LAST_NAME = 'User';

const seedAdminUser = async () => {
    try {
        // --- SEED SUPER ADMIN ---
        let superAdmin = await User.findOne({ email: SUPER_EMAIL });
        if (!superAdmin) {
            await User.create({
                firstName: SUPER_FIRST_NAME,
                lastName: SUPER_LAST_NAME,
                email: SUPER_EMAIL,
                phone: '8090100100',
                password: SUPER_PASSWORD,
                role: 'superadmin',
                isVerified: true
            });
            console.log('Archive Setup: Super Curator established with new secure access key.');
        } else {
            console.log('Archive Setup: Super Curator node verified.');
        }


        // --- AUTO-VERIFY ALL EXISTING USERS ---
        const verifyResult = await User.updateMany({ isVerified: false }, { $set: { isVerified: true } });
        if (verifyResult.modifiedCount > 0) {
            console.log(`Archive Sync: Auto-verified ${verifyResult.modifiedCount} legacy accounts.`);
        }
    } catch (err) {
        console.error('Archive Synchronization Failed:', err.message);
    }
};

module.exports = { seedAdminUser, SUPER_EMAIL, USER_EMAIL };
