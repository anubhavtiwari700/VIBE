const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Local storage only
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const localStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname.replace(/\\s+/g, '_')}`);
    }
});

const activeStorage = localStorage;

const fileFilter = (req, file, cb) => {
    const allowedMimetypes = /image|audio/;
    const mimetype = allowedMimetypes.test(file.mimetype);

    if (mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Format not supported! Use Standard Audio/Image files.'));
    }
};

const upload = multer({
    storage: activeStorage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100 MB limit
});

module.exports = upload;
