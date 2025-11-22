const express = require("express");
const router = express.Router();

const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
} = require("../controllers/newsController");

const uploadNewsImage = require("../middleware/uploadNewsImage");
const { protect, admin } = require("../middleware/authMiddleware");

/* ============================
   USER – Xem tin tức
=============================== */
router.get("/", protect, getAllNews);
router.get("/:id", protect, getNewsById);

/* ============================
   ADMIN – CRUD tin tức
=============================== */

// ➕ Tạo tin mới
router.post("/", protect, admin, createNews);

// ✏️ Sửa tin
router.put("/:id", protect, admin, updateNews);

// 🗑 Xoá tin
router.delete("/:id", protect, admin, deleteNews);

/* ============================
   ADMIN – Upload ảnh tin tức
=============================== */

router.post(
  "/upload",
  protect,
  admin,
  uploadNewsImage.single("image"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file được tải lên" });
    }

    const imageUrl = `/uploads/news/${req.file.filename}`;
    res.json({ url: imageUrl });
  }
);

module.exports = router;
