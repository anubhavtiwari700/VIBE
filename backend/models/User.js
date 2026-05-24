const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            default: '',
        },
        middleName: {
            type: String,
            default: '',
        },
        lastName: {
            type: String,
            default: '',
        },
        name: {
            type: String,
            default: '',
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
        },
        phone: {
            type: String,
            default: '',
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'superadmin'],
            default: 'user',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        otp: {
            type: String,
        },
        otpExpires: {
            type: Date,
        },
        likedSongs: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song'
        }],
        deletionRequested: {
            type: Boolean,
            default: false,
        },
        deletionReason: {
            type: String,
            default: '',
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        profileImg: {
            type: String,
            default: '',
        },
        bannerImg: {
            type: String,
            default: '',
        },
        history: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Song'
        }],
        lastSeen: {
            type: Date,
        }
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    return isMatch;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
