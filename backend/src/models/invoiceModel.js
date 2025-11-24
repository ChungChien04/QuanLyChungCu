const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  rental: { type: mongoose.Schema.Types.ObjectId, ref: "Rental", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  apartment: { type: mongoose.Schema.Types.ObjectId, ref: "Apartment", required: true },
  
  month: { type: Number, required: true }, // Tháng 1-12
  year: { type: Number, required: true },  // Năm 2025...

  // Chi tiết phí
  commonFee: { type: Number, required: true },
  cleaningFee: { type: Number, required: true },
  
  // Điện
  electricOldIndex: { type: Number, default: 0 }, // Số cũ
  electricNewIndex: { type: Number, required: true }, // Số mới
  electricUsage: { type: Number, required: true }, // Số tiêu thụ
  electricPrice: { type: Number, required: true }, // Đơn giá lúc chốt
  electricTotal: { type: Number, required: true }, // Thành tiền điện

  totalAmount: { type: Number, required: true }, // Tổng tiền phải đóng
  
  status: { 
    type: String, 
    enum: ["unpaid", "paid", "cancelled"], 
    default: "unpaid" 
  },
  paymentDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);