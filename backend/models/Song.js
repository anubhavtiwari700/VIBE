const mongoose = require('mongoose');

const songSchema = mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a song title'],
            index: true,
        },
        artist: {
            type: String,
            required: [true, 'Please add an artist name'],
            index: true,
        },
        album: {
            type: String,
            default: 'Single',
        },
        duration: {
            type: Number, // in seconds
            required: true,
            default: 0
        },
        fileUrl: {
            type: String,
            required: [true, 'Please add the streamable url for this track'],
        },
        coverImageUrl: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        playCount: {
            type: Number,
            default: 0
        },
        fileHash: {
            type: String,
            unique: true,
            sparse: true
        },
        fileSize: {
            type: Number, // in bytes
            default: 0
        }
    },
    {
        timestamps: true,
    }
);

// Optimize searches for user requests
songSchema.index({ title: 'text', artist: 'text' });

const Song = mongoose.model('Song', songSchema);
module.exports = Song;
