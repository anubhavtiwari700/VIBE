const mongoose = require('mongoose');

const playlistSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a playlist name'],
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        description: {
            type: String,
        },
        songs: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Song',
            }
        ],
        isPublic: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);

const Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;
