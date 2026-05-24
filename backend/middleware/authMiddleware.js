const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    // 1. Check cookies
    if (req.cookies && req.cookies.jwt) {
        token = req.cookies.jwt;
    } 
    // 2. Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer')) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2) {
            token = parts[1];
        }
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if(!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            if(!req.user.isVerified) {
                return res.status(403).json({ message: 'Account not verified. Access restricted.' });
            }
            if(req.user.isBlocked) {
                return res.status(403).json({ message: 'ACCOUNT_BLOCKED', detail: 'Your account has been suspended by an administrator.' });
            }

            // Update lastSeen (throttled to once every 5 minutes to reduce DB load)
            const now = new Date();
            if (!req.user.lastSeen || (now - req.user.lastSeen) > 5 * 60 * 1000) {
                req.user.lastSeen = now;
                // Run update asynchronously without awaiting it to keep response times fast
                User.updateOne({ _id: req.user._id }, { lastSeen: now }).catch(err => console.error("lastSeen update failed:", err));
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    const systemLockKey = process.env.ADMIN_SYSTEM_LOCK_KEY;
    const clientSystemKey = req.headers['x-vibe-system-lock'];

    // If a system lock is configured, enforce it strictly.
    if (systemLockKey && clientSystemKey !== systemLockKey) {
        return res.status(403).json({ 
            message: 'Access Denied: This system is not authorized for administrative operations.' 
        });
    }

    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
