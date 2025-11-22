// /backend/src/models/contractModel.js
const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    tenant: {                          // Người thuê (cư dân)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    apartment: {                       // Căn hộ liên quan
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Apartment',
      required: true,
    },
    startDate: {                       // Ngày bắt đầu
      type: Date,
      required: true,
    },
    endDate: {                         // Ngày kết thúc
      type: Date,
      required: true,
    },
    monthlyRent: {                     // Giá thuê / tháng
      type: Number,
      required: true,
    },
    deposit: {                         // Tiền cọc
      type: Number,
      default: 0,
    },
    status: {                          // Trạng thái hợp đồng
      type: String,
      enum: ['draft', 'active', 'expiring', 'expired', 'terminated'],
      default: 'draft',
    },
    signedAt: { type: Date },          // Ngày ký
    signedBy: {                        // Admin xử lý
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
