const express = require('express');
const router = express.Router();
const { 
    getSongs, 
    searchSongs, 
    addSong, 
    deleteSong, 
    deleteSongsBulk, 
    clearAllSongs, 
    getDuplicates,
    resetPlayCounts 
} = require('../controllers/songController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/', getSongs);
router.get('/search', searchSongs);
router.get('/duplicates', protect, admin, getDuplicates);
router.post('/', protect, admin, upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), addSong);
router.delete('/bulk', protect, admin, deleteSongsBulk);
router.delete('/clear-all', protect, admin, clearAllSongs);
router.put('/reset-graph', protect, admin, resetPlayCounts);
router.delete('/:id', protect, admin, deleteSong);

module.exports = router;
