const mongoose = require("mongoose");

const rentalSchema = new mongoose.Schema(
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

    // ⭐ User chỉ chọn số tháng khi tạo đơn thuê
    months: { type: Number, required: true },

    // ⭐ startDate / endDate bạn tự thêm — giữ nguyên
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    totalPrice: { type: Number, required: true },

    // ⭐ MERGE HOÀN CHỈNH — GIỮ RESERVED + GIỮ ENUM CỦA BẠN
    status: {
      type: String,
      enum: [
        "pending",
        "reserved",    
        "approved",
        "rented",
        "cancelling",
        "cancelled",
      ],
      default: "pending",
    },

    contractSigned: { type: Boolean, default: false },
    paymentDone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Rental || mongoose.model("Rental", rentalSchema);