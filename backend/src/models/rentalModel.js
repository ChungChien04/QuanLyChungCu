const mongoose = require("mongoose");
const rentalSchema = new mongoose.Schema({
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: "Apartment", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // ⭐ user chỉ chọn số tháng khi tạo đơn thuê
  months: { type: Number, required: true },

  // ⭐ ngày bắt đầu/kết thúc chỉ sinh ra khi user ký hợp đồng
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },

  totalPrice: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "approved", "rented", "cancelling", "cancelled"],
    default: "pending"
  },

  contractSigned: { type: Boolean, default: false },
  paymentDone: { type: Boolean, default: false },
  paymentQRCode: { type: String, default: "" }

}, { timestamps: true });

module.exports = mongoose.models.Rental || mongoose.model("Rental", rentalSchema);
