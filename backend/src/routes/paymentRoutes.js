// /backend/src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
  createPayment,
  getMyPayments,
  getAllPayments,
  updatePaymentStatus,
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Cư dân: tạo và xem thanh toán của mình
router.post('/', protect, createPayment);        // UC6 - tạo thanh toán
router.get('/my', protect, getMyPayments);       // UC6 - xem lịch sử cá nhân

// Admin: quản lý thanh toán
router.get('/', protect, admin, getAllPayments); // UC11 - xem tất cả
router.put('/:id/status', protect, admin, updatePaymentStatus); // UC11 - cập nhật trạng thái

module.exports = router;
