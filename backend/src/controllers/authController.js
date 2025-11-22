const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

/* ======================================================
   TOKEN GENERATOR
====================================================== */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/* ======================================================
   1. Gửi OTP ĐĂNG KÝ
====================================================== */
exports.registerRequest = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Thiếu thông tin đăng ký" });

    const exist = await User.findOne({ email });
    if (exist)
      return res.status(400).json({ message: "Email đã tồn tại" });

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    await OTP.create({
      email,
      code: otpCode,
      purpose: "register",
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendEmail({
      to: email,
      subject: "Mã OTP xác thực đăng ký",
      html: `<h2>Mã OTP của bạn là: <b>${otpCode}</b></h2>`
    });

    return res.json({ message: "OTP đã gửi!" });

  } catch (err) {
    console.error("registerRequest error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/* ======================================================
   2. VERIFY OTP
====================================================== */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ message: "Thiếu email hoặc OTP" });

    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord)
      return res.status(400).json({ message: "OTP không tồn tại" });

    if (otpRecord.code != otp)
      return res.status(400).json({ message: "OTP sai" });

    if (otpRecord.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP hết hạn" });

    return res.json({ valid: true, message: "OTP hợp lệ" });

  } catch (err) {
    console.error("verifyOtp error:", err);
    return res.status(500).json({ message: "Lỗi verify OTP" });
  }
};

/* ======================================================
   3. ĐĂNG KÝ SAU KHI VERIFY OTP
====================================================== */
exports.registerVerify = async (req, res) => {
  try {
    const { name, email, password, otp } = req.body;

    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.code != otp)
      return res.status(400).json({ message: "OTP sai hoặc không hợp lệ" });

    if (otpRecord.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP hết hạn" });

    await User.create({ name, email, password });

    await OTP.deleteMany({ email });

    return res.json({ message: "Đăng ký thành công!" });

  } catch (err) {
    console.error("registerVerify error:", err);
    return res.status(500).json({ message: "Lỗi tạo tài khoản" });
  }
};

/* ======================================================
   4. LOGIN
====================================================== */
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    return res.json({
      message: "Đăng nhập thành công",
      token: generateToken(user._id),
      user,
    });

  } catch (err) {
    console.error("loginUser error:", err);
    return res.status(500).json({ message: "Lỗi đăng nhập" });
  }
};

/* ======================================================
   5. LẤY PROFILE
====================================================== */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      gender: user.gender || "other",
      birthday: user.birthday || "",
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    });

  } catch (err) {
    console.error("getUserProfile error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy hồ sơ" });
  }
};

/* ======================================================
   6. CẬP NHẬT PROFILE
====================================================== */
exports.updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Cập nhật name, phone, address
    user.name = req.body.name ?? user.name;
    user.phone = req.body.phone ?? user.phone;
    user.address = req.body.address ?? user.address;

    // Cập nhật gender
    if (req.body.gender && req.body.gender !== "") {
      user.gender = req.body.gender;
    }

    // Cập nhật birthday
    if (req.body.birthday && req.body.birthday !== "") {
      user.birthday = req.body.birthday.substring(0, 10);
    }

    await user.save();

    res.json({
      message: "Cập nhật thành công",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        birthday: user.birthday,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("updateUserProfile error:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật hồ sơ" });
  }
};


/* ======================================================
   7. QUÊN MẬT KHẨU
====================================================== */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Email không tồn tại" });

    const otpCode = Math.floor(100000 + Math.random() * 900000);

    await OTP.create({
      email,
      code: otpCode,
      purpose: "reset",
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await sendEmail({
      to: email,
      subject: "OTP reset mật khẩu",
      html: `<h3>OTP reset mật khẩu: <b>${otpCode}</b></h3>`
    });

    return res.json({ message: "OTP reset mật khẩu đã gửi!" });

  } catch (err) {
    console.error("forgotPassword error:", err);
    return res.status(500).json({ message: "Lỗi server" });
  }
};

/* ======================================================
   8. RESET PASSWORD
====================================================== */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord || otpRecord.code != otp)
      return res.status(400).json({ message: "OTP sai hoặc không hợp lệ" });

    if (otpRecord.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP hết hạn" });

    const user = await User.findOne({ email });
    user.password = newPassword;
    await user.save();

    await OTP.deleteMany({ email });

    return res.json({ message: "Đổi mật khẩu thành công!" });

  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ message: "Lỗi reset mật khẩu" });
  }
};

/* ======================================================
   9. ĐỔI MẬT KHẨU KHI ĐÃ ĐĂNG NHẬP
====================================================== */
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Thiếu mật khẩu cũ hoặc mật khẩu mới" });

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Người dùng không tồn tại" });

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch)
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

    user.password = newPassword;
    await user.save();

    return res.json({ message: "Đổi mật khẩu thành công!" });

  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ message: "Lỗi đổi mật khẩu" });
  }
};
/* ======================================================
   10. CẬP NHẬT AVATAR
====================================================== */
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "Không có ảnh tải lên" });

    const user = await User.findById(req.user.id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    user.avatar = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({
      message: "Cập nhật avatar thành công",
      avatar: user.avatar,
    });

  } catch (error) {
    console.error("updateAvatar error:", error);
    res.status(500).json({ message: "Lỗi cập nhật avatar" });
  }
};

