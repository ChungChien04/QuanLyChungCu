const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Tạo thư mục nếu chưa có
const uploadDir = "uploads/avatars";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, "avatar_" + Date.now() + ext);
  },
});

// Chỉ chấp nhận ảnh
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Chỉ cho phép ảnh JPG/PNG"), false);
};

module.exports = multer({ storage, fileFilter });
