const User = require("../models/userModel");

const createDefaultAdmin = async () => {
  try {
    const exists = await User.findOne({ email: "admin@system.com" });

    if (!exists) {
      await User.create({
        name: "Admin",
        email: "admin@system.com",
        password: "admin123",  // KHÔNG TỰ HASH
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
