const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const User = require("../models/userModel");

router.get("/my-counts", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.unreadNotifications);
});

router.post("/clear", protect, async (req, res) => {
  const { type } = req.body;

  const user = await User.findById(req.user._id);
  user.unreadNotifications[type] = 0;

  await user.save();
  res.json({ message: "Đã đánh dấu đã đọc" });
});

module.exports = router;
