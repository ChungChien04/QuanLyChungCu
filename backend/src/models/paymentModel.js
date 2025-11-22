// /backend/src/models/paymentModel.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {               // Cư dân thanh toán
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {               // Loại phí
      type: String,
      enum: ['management', 'electricity', 'water', 'parking', 'cleaning', 'other'],
      required: true,
    },
    amount: {             // Số tiền
      type: Number,
      required: true,
      min: 0,
    },
    method: {             // Phương thức
      type: String,
      enum: ['wallet', 'card', 'bank_transfer', 'qr', 'cash'],
      default: 'qr',
    },
    status: {             // Trạng thái thanh toán
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    dueDate: {            // Hạn thanh toán
      type: Date,
    },
    paidAt: {             // Ngày thanh toán thực tế
      type: Date,
    },
    note: {               // Ghi chú (nếu có)
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
