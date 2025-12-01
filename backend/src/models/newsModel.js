// backend/src/models/newsModel.js
const mongoose = require("mongoose");

const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    content: { type: String, required: true },

    // đúng chuẩn array
    images: { type: [String], default: [] },

    // ảnh đại diện - tự động lấy ảnh đầu
    thumbnail: { type: String, default: "" },

    status: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("News", newsSchema);
