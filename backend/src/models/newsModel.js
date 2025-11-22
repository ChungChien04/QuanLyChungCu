const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, required: true },

    // ✅ mới: lưu nhiều ảnh
    images: [{ type: String, default: [] }],

    // (tuỳ chọn) giữ thumbnail để tương thích, dùng ảnh đầu làm thumbnail
    thumbnail: { type: String, default: "" },

    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
