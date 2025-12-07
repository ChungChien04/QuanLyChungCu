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

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },

    totalPrice: { type: Number, required: true },

    // ⭐ Trạng thái đơn thuê
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

    // ⭐ Đã ký hợp đồng chưa
    contractSigned: { type: Boolean, default: false },

    // ⭐ TEXT hợp đồng do user ký (controller có dùng!)
    contractText: {
      type: String,
      default: "",
    },

    // ⭐ Đã thanh toán lần đầu chưa
    paymentDone: { type: Boolean, default: false },

    // =====================================================
    // 🔥 HỆ THỐNG THÔNG BÁO 2 CHIỀU (ADMIN <-> USER)
    // =====================================================

    // Admin có việc cần xử lý từ phía user
    adminUnread: {
      type: Boolean,
      default: false,
    },

    // User có cập nhật mới từ phía admin
    userUnread: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Rental || mongoose.model("Rental", rentalSchema);
