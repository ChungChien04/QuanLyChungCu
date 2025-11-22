// /backend/src/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

// Chỉ Admin được xem dashboard tổng quan
router.get('/dashboard', protect, admin, getDashboardStats);

module.exports = router;
