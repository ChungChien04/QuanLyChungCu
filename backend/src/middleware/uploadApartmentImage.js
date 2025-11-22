// backend/src/middleware/uploadApartmentImage.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Đảm bảo thư mục tồn tại
const uploadDir = "uploads/apartments";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "apt_" + Date.now() + ext);
  },
});

// Chỉ cho phép file ảnh
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Chỉ cho phép ảnh JPG/PNG"), false);
};

module.exports = multer({ storage, fileFilter });
