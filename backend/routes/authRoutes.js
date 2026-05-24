const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser); 
router.post('/verify-otp', verifyOTP);
router.post('/complete-profile', completeProfile);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getProfile);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

router.post('/liked/:songId', protect, toggleLike);
router.get('/liked', protect, getLikedSongs);

router.post('/history/:songId', protect, addToHistory);
router.get('/history', protect, getHistory);
router.delete('/history', protect, clearHistory);

router.put('/password', protect, updatePassword);
router.post('/request-deletion', protect, requestDeletion);
router.post('/approve-deletion/:id', protect, admin, approveDeletion);
router.post('/create-admin', protect, admin, createAdmin);
router.post('/cancel-deletion', protect, cancelDeletionRequest);
router.put('/profile', protect, upload.fields([
    { name: 'profileImg', maxCount: 1 },
    { name: 'bannerImg', maxCount: 1 }
]), updateProfile);
router.put('/users/update/:id', protect, admin, adminUpdateUser);
router.put('/users/block/:id', protect, admin, toggleBlockUser);
router.put('/reset-password/:id', protect, admin, resetUserPassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password-otp', resetPasswordWithOTP);

module.exports = router;
