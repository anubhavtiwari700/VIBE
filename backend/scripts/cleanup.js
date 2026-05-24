const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Song = require('../models/Song');

dotenv.config();

const cleanup = async () => {
  try {
    // 1. Connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to VIBE Core Node...');

    // 2. Clear Songs
    await Song.deleteMany({});
    console.log('Synchronized Archive: Songs purged.');

    // 3. Clear Users (Leaving ONLY the admin/superadmin emails if known)
    // Actually, usually users want a total wipe except the core admin.
    await User.deleteMany({ role: { $ne: 'superadmin' } });
    console.log('Synchronized Archive: Listeners purged (Admins retained).');

    // 4. Clear Uploads
    const uploadsDir = path.join(__dirname, '../uploads');
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file !== '.gitkeep') {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }
    console.log('Filesystem: Uploads directory zeroed out.');

    process.exit();
  } catch (err) {
    console.error('Archive purge failed:', err.message);
    process.exit(1);
  }
};

cleanup();
