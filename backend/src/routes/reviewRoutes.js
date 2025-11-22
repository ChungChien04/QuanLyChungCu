// /backend/src/routes/reviewRoutes.js
const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewsByApartment,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  updateUserReview,
  deleteUserReview,
} = require("../controllers/reviewController");

const { protect, admin } = require("../middleware/authMiddleware");
const { replyReview, deleteReply } = require("../controllers/reviewController");

/* ========================================
   ADMIN ROUTES (đặt lên trên để không bị đè)
======================================== */

// Admin lấy toàn bộ review
router.get("/", protect, admin, getAllReviews);

// Admin cập nhật trạng thái review
router.put("/:id/status", protect, admin, updateReviewStatus);

// Admin xóa review
router.delete("/:id", protect, admin, deleteReview);

/* ========================================
   USER ROUTES
======================================== */

// User tạo review
router.post("/:apartmentId", protect, createReview);

// User sửa review của chính mình
router.put("/user/:id", protect, updateUserReview);

// User xoá review của chính mình
router.delete("/user/:id", protect, deleteUserReview);

/* ========================================
   PUBLIC ROUTES
======================================== */

// Public lấy review theo căn hộ
router.get("/:apartmentId", getReviewsByApartment);
// Admin phản hồi review
router.put("/:id/reply", protect, admin, replyReview);

// Admin xoá phản hồi
router.delete("/:id/reply", protect, admin, deleteReply);

module.exports = router;
