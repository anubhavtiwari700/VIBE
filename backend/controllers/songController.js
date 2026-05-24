const Song = require('../models/Song');
const crypto = require('crypto');
const fs = require('fs');

const cleanInput = (str) => {
    if (!str) return '';
    return str
        .replace(/\.(com|in|net|org|co|uk|pk|top|xyz|club|info|me|biz|tv|news|online|site|live|work|tech)\b/gi, '')
        .replace(/(djpunjab|koshalworld|pagalworld|mr-jatt|mrjatt|sambalpuristar|dj|new|songs|star|download|high|quality|mp3|original|exclusive|vibe|official|pawanmobi|remix|mix|web|wap)\b/gi, '')
        .replace(/[_\-\[\]\(\)]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// @desc    Get all songs
// @route   GET /api/songs
// @access  Public
const getSongs = async (req, res) => {
    try {
        const songs = await Song.find({}).populate('createdBy', 'name');
        res.json(songs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Search songs
// @route   GET /api/songs/search
// @access  Public
const searchSongs = async (req, res) => {
    try {
        const { query } = req.query;
        const songs = await Song.find({
            $or: [
                { title: { $regex: query, $options: 'i' } },
                { artist: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(songs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Add a song (Admin only)
// @route   POST /api/songs
// @access  Private/Admin
const addSong = async (req, res) => {
    try {
        let { title, artist, album, duration, fileUrl, coverImageUrl } = req.body;
        let fileHash = null;
        let fileSize = 0;
        
        const cleanTitle = cleanInput(title);
        const cleanArtist = cleanInput(artist);

        if (req.files) {
            if (req.files.audio && req.files.audio[0]) {
               const audioFile = req.files.audio[0];
               fileUrl = `/uploads/${audioFile.filename}`;
               fileSize = audioFile.size || 0;
               
               if (fs.existsSync(audioFile.path)) {
                   const fileBuffer = fs.readFileSync(audioFile.path);
                   fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
               }
            }
            if (req.files.cover && req.files.cover[0]) {
               coverImageUrl = `/uploads/${req.files.cover[0].filename}`;
            }
        }

        if (!cleanTitle || !cleanArtist || !fileUrl) {
            return res.status(400).json({ message: 'Valid title, artist and audio file are required' });
        }

        if (fileHash) {
            const duplicateByHash = await Song.findOne({ fileHash });
            if (duplicateByHash) {
                return res.status(400).json({ message: 'This exact audio file already exists.' });
            }
        }

        const duplicateByMeta = await Song.findOne({ title: cleanTitle, artist: cleanArtist });
        if (duplicateByMeta) {
            return res.status(400).json({ message: 'A track with this title and artist already exists.' });
        }

        const song = await Song.create({
            title: cleanTitle,
            artist: cleanArtist,
            album: cleanInput(album) || 'Single',
            duration: parseInt(duration) || 0,
            fileUrl,
            coverImageUrl,
            fileHash: fileHash || undefined,
            fileSize,
            createdBy: req.user._id
        });

        res.status(201).json(song);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete a song (Admin only)
// @route   DELETE /api/songs/:id
// @access  Private/Admin
const deleteSong = async (req, res) => {
    try {
        const song = await Song.findById(req.params.id);
        if (song) {
            await Song.deleteOne({ _id: song._id });
            res.json({ message: 'Song removed' });
        } else {
            res.status(404).json({ message: 'Song not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete multiple songs (Admin only)
// @route   DELETE /api/songs/bulk
// @access  Private/Admin
const deleteSongsBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ message: 'Invalid song identifiers provided' });
        }
        await Song.deleteMany({ _id: { $in: ids } });
        res.json({ message: `${ids.length} song nodes terminated successfully` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Find duplicate songs
// @route   GET /api/songs/duplicates
// @access  Private/Admin
const getDuplicates = async (req, res) => {
    try {
        const allSongs = await Song.find({});
        const duplicates = [];
        const seenHashes = new Map();
        const seenMeta = new Map(); // CleanedTitle + CleanedArtist

        allSongs.forEach(song => {
            const cleanedTitle = cleanInput(song.title);
            const cleanedArtist = cleanInput(song.artist);
            const metaKey = `${cleanedTitle}-${cleanedArtist}`.toLowerCase();

            // 1. Check by Hash (Exact file match)
            if (song.fileHash) {
                if (seenHashes.has(song.fileHash)) {
                    duplicates.push({
                        type: 'Exact File (Hash Match)',
                        original: seenHashes.get(song.fileHash),
                        duplicate: song
                    });
                } else {
                    seenHashes.set(song.fileHash, song);
                }
            }

            // 2. Check by Meta (Title + Artist match)
            if (seenMeta.has(metaKey)) {
                // To avoid double counting songs already found by hash
                if (!duplicates.some(d => (d.duplicate._id.toString() === song._id.toString()))) {
                    duplicates.push({
                        type: 'Metadata Match',
                        original: seenMeta.get(metaKey),
                        duplicate: song
                    });
                }
            } else {
                seenMeta.set(metaKey, song);
            }
        });

        res.json(duplicates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Clear all songs (SuperAdmin only)
// @route   DELETE /api/songs/clear-all
// @access  Private/SuperAdmin
const clearAllSongs = async (req, res) => {
    try {
        const result = await Song.deleteMany({});
        res.json({ message: `All song nodes purged. ${result.deletedCount} records removed.` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Reset all play counts (SuperAdmin only)
// @route   PUT /api/songs/reset-graph
// @access  Private/SuperAdmin
const resetPlayCounts = async (req, res) => {
    try {
        await Song.updateMany({}, { playCount: 0 });
        res.json({ message: 'Metric clusters reset. Graph data cleared.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getSongs,
    searchSongs,
    addSong,
    deleteSong,
    deleteSongsBulk,
    clearAllSongs,
    getDuplicates,
    resetPlayCounts
};
