// /backend/src/routes/contractRoutes.js
const express = require('express');
const router = express.Router();
const {
  requestContract,
  getMyContracts,
  getAllContracts,
  updateContractStatus,
} = require('../controllers/contractController');

const { protect, admin } = require('../middleware/authMiddleware');

// Cư dân / Khách hàng đã đăng nhập: gửi yêu cầu hợp đồng
router.post('/', protect, requestContract);

// Cư dân: xem hợp đồng của mình
router.get('/my', protect, getMyContracts);

// Admin: quản lý tất cả hợp đồng
router.get('/', protect, admin, getAllContracts);
router.put('/:id/status', protect, admin, updateContractStatus);

module.exports = router;
