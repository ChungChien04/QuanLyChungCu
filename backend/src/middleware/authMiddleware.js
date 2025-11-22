// src/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// =============================
// 🔐 Middleware bảo vệ route
// =============================
const protect = async (req, res, next) => {
  let token = null;

  // Lấy token từ Header: Authorization: Bearer xxxxx
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      message: "Không tìm thấy token. Vui lòng đăng nhập lại.",
    });
  }

  try {
    // Giải mã token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tìm user trong DB (bỏ mật khẩu)
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "Token hợp lệ nhưng tài khoản không còn tồn tại.",
      });
    }

    req.user = user; // Gắn user vào request để controller dùng
    next();
  } catch (error) {
    console.error("❌ Lỗi token:", error.message);
    return res.status(401).json({
      message: "Token không hợp lệ hoặc đã hết hạn.",
    });
  }
};

// =============================
// 🔐 Middleware kiểm tra Admin
// =============================
const admin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Chưa đăng nhập.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Bạn không có quyền Admin.",
    });
  }

  next();
};

module.exports = { protect, admin };
