// /backend/src/models/reviewModel.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    apartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Apartment",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    serviceType: {
      type: String,
      enum: [
        "security",
        "cleaning",
        "reception",
        "parking",
        "management",
        "other",
      ],
      default: "other",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "hidden"],
      default: "approved",
    },

    isEdited: {
      type: Boolean,
      default: false,
    },
    reply: {
  content: { type: String, default: "" },
  repliedAt: { type: Date },
},

  },
  {
    timestamps: true,
  }
  
);

// ⭐ Index tối ưu hiệu năng
reviewSchema.index({ apartment: 1 });

// ⭐ Đánh dấu đánh giá đã chỉnh sửa
reviewSchema.pre("save", function (next) {
  if (
    this.isModified("content") ||
    this.isModified("rating") ||
    this.isModified("serviceType")
  ) {
    this.isEdited = true;
  }
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
