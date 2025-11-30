// /backend/src/config/createDefaultAdmin.js (ví dụ)
const User = require("../models/userModel");

const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@system.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

    const exists = await User.findOne({ email: adminEmail });

    if (!exists) {
      await User.create({
        name: "Admin",
        email: adminEmail,
        password: adminPassword, // KHÔNG tự hash, vì userSchema.pre('save') đã hash rồi
        role: "admin",
      });

      console.log("✅ Admin mặc định đã được tạo!");
    } else {
      console.log("ℹ️ Admin đã tồn tại.");
    }
  } catch (error) {
    console.error("❌ Lỗi tạo admin:", error);
  }
};

module.exports = createDefaultAdmin;
