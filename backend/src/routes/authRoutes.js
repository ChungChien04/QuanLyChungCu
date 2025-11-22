const express = require("express");
const router = express.Router();

const {
  registerRequest,
  registerVerify,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
   updateAvatar,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const uploadAvatar = require("../middleware/uploadAvatar");

// Đăng ký
router.post("/register/request", registerRequest);
router.post("/register/verify", registerVerify);

// Đăng nhập
router.post("/login", loginUser);

// Quên mật khẩu
router.post("/forgot-password", forgotPassword);

// Dùng chung cho đăng ký + reset pass
router.post("/verify-otp", verifyOtp);

// Reset mật khẩu
router.post("/reset-password", resetPassword);

// Profile
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/change-password", protect, changePassword);
router.put("/profile/avatar", protect, uploadAvatar.single("avatar"), updateAvatar);
const passport = require("../config/googleAuth");

// Step 1: Redirect to Google
router.get("/google", passport.authenticate("google", { scope: ["email", "profile"] }));

// Step 2: Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const jwt = require("jsonwebtoken");

    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.redirect(
      `http://localhost:5173/google/callback?token=${token}`
    );
  }
);

module.exports = router;
