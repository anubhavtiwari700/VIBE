const User = require('../models/User');
const Song = require('../models/Song');
const jwt = require('jsonwebtoken');
const { SUPER_EMAIL, USER_EMAIL } = require('../config/seedAdmin');
const sendEmail = require('../utils/emailService');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        
        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or Phone is required.' });
        }

        const emailLower = email ? email.toLowerCase().trim() : '';
        const phoneTrimmed = phone ? phone.trim() : '';

        if (emailLower === SUPER_EMAIL) {
            return res.status(403).json({ message: 'This address is reserved for vibe\'s curators.' });
        }

        if (!password || password.length < 6) {
           return res.status(400).json({ message: 'Security Key must be at least 6 characters.' });
        }

        if (emailLower && !emailLower.endsWith('@gmail.com')) {
            return res.status(403).json({ message: 'Only @gmail.com accounts are permitted in the user grid.' });
        }
        if (phoneTrimmed) {
            return res.status(403).json({ message: 'Phone registration is restricted. Please use a @gmail.com account.' });
        }

        // Check if user exists
        const query = emailLower ? { email: emailLower } : { phone: phoneTrimmed };
        let user = await User.findOne(query);

        if (user) {
            if (user.isVerified) {
                return res.status(400).json({ message: 'User already exists' });
            }
            // User exists but not verified - Update password and resend OTP
            user.password = password;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

        if (user) {
            user.password = password;
            user.otp = otp;
            user.otpExpires = otpExpires;
            user.isVerified = false;
            await user.save();
        } else {
            user = await User.create({
                email: emailLower,
                phone: phoneTrimmed,
                password,
                role: 'user',
                otp,
                otpExpires,
                isVerified: false
            });
        }

        try {
            await sendEmail({
                to: emailLower,
                subject: 'VIBE: Your Identity OTP',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Verify Your Identity</h2>
                        <p>Welcome to VIBE. Use the following code to complete your registration:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #8b5cf6; padding: 10px 0;">${otp}</div>
                        <p>This code expires in 15 minutes.</p>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('[AUTH] Email Failure:', emailErr.message);
            return res.status(201).json({ 
                message: 'Account established, but email delivery timed out. Please try Resend OTP.',
                isVerified: false,
                email: user.email
            });
        }

        res.status(201).json({ 
            message: 'Verification code dispatched to your email.',
            isVerified: false,
            email: user.email
        });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    try {
        const { email, phone, otp } = req.body;
        const query = email ? { email: email.toLowerCase().trim() } : { phone: phone.trim() };
        const user = await User.findOne(query);

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Account is already verified' });
        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
        if (new Date() > user.otpExpires) return res.status(400).json({ message: 'OTP has expired.' });

        user.otp = undefined;
        user.otpExpires = undefined;
        user.isVerified = true; // Set verified to true immediately after OTP
        await user.save();

        res.json({ message: 'OTP Verified', success: true });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Complete Profile (Step 3)
// @route   POST /api/auth/complete-profile
// @access  Public
const completeProfile = async (req, res) => {
    try {
        const { email, phone, firstName, middleName, lastName } = req.body;
        const query = email ? { email: email.toLowerCase().trim() } : { phone: phone.trim() };
        const user = await User.findOne(query);

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!firstName || !lastName) return res.status(400).json({ message: 'First and Last name are required.' });

        user.firstName = firstName;
        user.middleName = middleName || '';
        user.lastName = lastName;
        user.name = `${firstName} ${lastName}`.trim();
        user.isVerified = true;
        await user.save();

        const token = generateToken(user._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, 
        });

        res.json({
            _id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            firstName: user.firstName,
            lastName: user.lastName,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            token
        });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Verify Email / OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

        const emailLower = email.toLowerCase().trim();
        const user = await User.findOne({ email: emailLower });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Account is already verified' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP has expired. Please register again.' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = generateToken(user._id);
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, 
        });

        return res.json({
            _id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImg: user.profileImg,
            bannerImg: user.bannerImg,
            createdAt: user.createdAt,
            isBlocked: user.isBlocked,
            token
        });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if ((!email && !phone) || !password) {
            return res.status(400).json({ message: 'Identity Node (Email or Phone) and Password are required.' });
        }

        const emailLower = email ? email.toLowerCase().trim() : '';
        const phoneTrimmed = phone ? phone.trim() : '';

        const query = emailLower ? { email: emailLower } : { phone: phoneTrimmed };
        const user = await User.findOne(query);

        if (!user) {
            return res.status(401).json({ message: 'User not found in the vibe\'s grid.' });
        }

        if (user.role === 'user' || !user.role) {
            if (!user.email || !user.email.endsWith('@gmail.com')) {
                return res.status(403).json({ message: 'Only @gmail.com accounts are permitted in the user grid.' });
            }
        }
        
        const isMatch = await user.matchPassword(password);
        console.log(`Login attempt for ${email}: User found. Password match: ${isMatch}`);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect Password' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Account not verified. Please complete registration.' });
        }

        const token = generateToken(user._id);

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, 
        });

        return res.json({
            _id: user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            profileImg: user.profileImg,
            bannerImg: user.bannerImg,
            createdAt: user.createdAt,
            isBlocked: user.isBlocked,
            token
        });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                name: user.name || `${user.firstName} ${user.lastName}`.trim() || 'User',
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profileImg: user.profileImg,
                bannerImg: user.bannerImg,
                createdAt: user.createdAt,
                deletionRequested: user.deletionRequested,
                deletionReason: user.deletionReason,
                isBlocked: user.isBlocked,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('likedSongs').populate('history');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            if (user.role === 'superadmin') {
                return res.status(400).json({ message: 'Cannot delete superadmin' });
            }
            if (user.role === 'admin' && req.user.role !== 'superadmin') {
                return res.status(400).json({ message: 'Cannot delete admin user' });
            }

            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Toggle like for a song
// @route   POST /api/auth/liked/:songId
// @access  Private
const toggleLike = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { songId } = req.params;

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.likedSongs) {
            user.likedSongs = [];
        }

        const songIndex = user.likedSongs.findIndex(id => id.toString() === songId);
        
        if (songIndex === -1) {
            user.likedSongs.push(songId);
            await user.save();
            res.json({ message: 'Song liked', liked: true });
        } else {
            user.likedSongs.splice(songIndex, 1);
            await user.save();
            res.json({ message: 'Song unliked', liked: false });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get liked songs
// @route   GET /api/auth/liked
// @access  Private
const getLikedSongs = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('likedSongs');
        if (user) {
            res.json(user.likedSongs);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const requiredLen = user.email.endsWith('@vibecom') ? 10 : 6;
        if (newPassword.length !== requiredLen) {
            return res.status(400).json({ message: `Access keys for ${user.email} nodes must be exactly ${requiredLen} characters.` });
        }

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Incorrect Password' });
        }

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Request account deletion
// @route   POST /api/auth/request-deletion
// @access  Private
const requestDeletion = async (req, res) => {
    try {
        const { email, password, reason } = req.body;
        const user = await User.findById(req.user._id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.deletionRequested) {
            return res.status(400).json({ message: 'A termination request is already pending.' });
        }

        // Verification check
        if (user.email !== email) {
            return res.status(401).json({ message: 'Email address verification failed.' });
        }

        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Security password verification failed.' });
        }

        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({ message: 'A valid reason (min 5 chars) is required for termination.' });
        }

        user.deletionRequested = true;
        user.deletionReason = reason;
        await user.save();
        
        res.json({ message: 'Termination request successfully recorded.' });
    } catch (err) {
        console.error('Deletion Request Error:', err);
        res.status(500).json({ message: 'System failure during termination request.' });
    }
};

// @desc    Cancel account deletion request
// @route   POST /api/auth/cancel-deletion
// @access  Private
const cancelDeletionRequest = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.deletionRequested = false;
            user.deletionReason = '';
            await user.save();
            res.json({ message: 'Deletion request cancelled successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Approve user deletion
// @route   POST /api/auth/approve-deletion/:id
// @access  Private/Admin
const approveDeletion = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.role === 'superadmin') {
                return res.status(400).json({ message: 'Cannot delete superadmin' });
            }
            if (user.role === 'admin' && req.user.role !== 'superadmin') {
                return res.status(400).json({ message: 'Cannot delete admin' });
            }

            await User.deleteOne({ _id: user._id });
            res.json({ message: 'User account deleted successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Create new Admin
// @route   POST /api/auth/create-admin
// @access  Private/Admin
const createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Please add all fields' });

        const cleanEmail = email.trim().toLowerCase();
        const isVibecom = cleanEmail.endsWith('@vibecom');
        const requiredLen = isVibecom ? 10 : 6;
        
        if (password.length !== requiredLen) {
            return res.status(400).json({ message: `Access keys for ${isVibecom ? 'system nodes (@vibecom)' : 'curator nodes'} must be exactly ${requiredLen} characters.` });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const adminUser = await User.create({
            name: name, // Using provided name
            firstName: name.split(' ')[0] || '',
            lastName: name.split(' ')[1] || '',
            email: email,
            password: password,
            role: 'admin',
            isVerified: true
        });

        res.status(201).json({ message: 'Admin account created successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update user profile images
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (req.body.name) {
                user.name = req.body.name; // Keep for legacy
                user.firstName = req.body.name.split(' ')[0] || '';
                user.lastName = req.body.name.split(' ').slice(1).join(' ') || '';
            }

            if (req.files) {
                if (req.files.profileImg) {
                    user.profileImg = `/uploads/${req.files.profileImg[0].filename}`;
                }
                if (req.files.bannerImg) {
                    user.bannerImg = `/uploads/${req.files.bannerImg[0].filename}`;
                }
            }

            // Handle image removal if requested
            if (req.body.removeProfileImg === 'true') {
                user.profileImg = '';
            }
            if (req.body.removeBannerImg === 'true') {
                user.bannerImg = '';
            }
            
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                role: updatedUser.role,
                profileImg: updatedUser.profileImg,
                bannerImg: updatedUser.bannerImg,
                createdAt: updatedUser.createdAt
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Toggle user block status (Admin functionality)
// @route   PUT /api/auth/users/block/:id
// @access  Private/Admin
const toggleBlockUser = async (req, res) => {
    try {
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

        if (userToUpdate.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only superadmins can modify other superadmins' });
        }

        userToUpdate.isBlocked = !userToUpdate.isBlocked;
        await userToUpdate.save();

        res.json({ message: `Account ${userToUpdate.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked: userToUpdate.isBlocked });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Reset user password (Admin functionality)
// @route   PUT /api/auth/reset-password/:id
// @access  Private/Admin
const resetUserPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword) return res.status(400).json({ message: 'Please provide new password' });
        
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

        const requiredLen = userToUpdate.email.endsWith('@vibecom') ? 10 : 6;
        if (newPassword.length !== requiredLen) {
            return res.status(400).json({ message: `Security key for this node must be exactly ${requiredLen} characters.` });
        }

        if (!userToUpdate) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Authorization check
        if (userToUpdate.role === 'superadmin') {
            return res.status(403).json({ message: 'Cannot reset superadmin password via this endpoint' });
        }
        if (userToUpdate.role === 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only superadmin can reset admin passwords' });
        }

        userToUpdate.password = newPassword;
        await userToUpdate.save();
        res.json({ message: `Password reset successfully` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Add song to history
// @route   POST /api/auth/history/:songId
// @access  Private
const addToHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { songId } = req.params;

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Remove if already exists (to move to top)
        user.history = user.history.filter(id => id.toString() !== songId);
        
        // Add to top
        user.history.unshift(songId);

        // Limit to 50
        if (user.history.length > 50) {
            user.history = user.history.slice(0, 50);
        }

        // Increment Global Play Count for analytics
        await Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } });

        await user.save();
        res.json({ message: 'Node history updated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Get listening history
// @route   GET /api/auth/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('history');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user.history || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Clear listening history
// @route   DELETE /api/auth/history
// @access  Private
const clearHistory = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.history = [];
        await user.save();
        res.json({ message: 'Node history cleared' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update any user's name (Admin functionality)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const adminUpdateUser = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Please provide a name' });
        
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) return res.status(404).json({ message: 'User not found' });

        // Authorization check
        if (userToUpdate.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Only superadmins can modify other superadmins' });
        }

        userToUpdate.name = name;
        userToUpdate.firstName = name.split(' ')[0] || '';
        userToUpdate.lastName = name.split(' ').slice(1).join(' ') || '';
        
        await userToUpdate.save();
        res.json({ message: 'User name updated successfully', user: userToUpdate });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Please provide an email.' });

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: 'VIBE: Password Reset OTP',
                html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2>Password Reset Request</h2>
                        <p>Use the following code to reset your security key:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #f43f5e; padding: 10px 0;">${otp}</div>
                        <p>This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                `
            });
            res.json({ message: 'Reset code dispatched to your email.' });
        } catch (emailErr) {
            console.error('[AUTH] Forgot Password Email Failure:', emailErr.message);
            res.status(500).json({ message: 'Failed to send reset code. Please try again later.' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password-otp
// @access  Public
const resetPasswordWithOTP = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, code, and new security key are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (user.otp !== otp) return res.status(400).json({ message: 'Invalid reset code.' });
        if (new Date() > user.otpExpires) return res.status(400).json({ message: 'Reset code has expired.' });

        const requiredLen = user.email.endsWith('@vibecom') ? 10 : 6;
        if (newPassword.length < requiredLen) {
            return res.status(400).json({ message: `Security key must be at least ${requiredLen} characters.` });
        }

        user.password = newPassword;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Security key updated successfully. You can now log in.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    getUsers,
    deleteUser,
    toggleLike,
    getLikedSongs,
    updatePassword,
    requestDeletion,
    approveDeletion,
    createAdmin,
    updateProfile,
    resetUserPassword,
    adminUpdateUser,
    cancelDeletionRequest,
    addToHistory,
    getHistory,
    clearHistory,
    verifyOTP,
    completeProfile,
    toggleBlockUser,
    forgotPassword,
    resetPasswordWithOTP
};
