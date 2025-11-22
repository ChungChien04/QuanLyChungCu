// /backend/src/controllers/paymentController.js
const Payment = require('../models/paymentModel');

// === Cư dân: tạo yêu cầu thanh toán (UC6) ===
exports.createPayment = async (req, res) => {
  try {
    const { type, amount, method, dueDate, note } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ message: 'Vui lòng nhập loại phí và số tiền.' });
    }

    const payment = await Payment.create({
      user: req.user._id,   // từ middleware protect
      type,
      amount,
      method: method || 'qr',
      dueDate,
      note,
    });

    res.status(201).json(payment);
  } catch (err) {
    console.error('createPayment error:', err);
    res.status(500).json({ message: 'Lỗi server khi tạo phiếu thanh toán.' });
  }
};

// === Cư dân: xem lịch sử thanh toán của mình (UC6) ===
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử thanh toán.' });
  }
};

// === Admin: xem toàn bộ thanh toán (UC11) ===
exports.getAllPayments = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const payments = await Payment.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách thanh toán.' });
  }
};

// === Admin: xác nhận / cập nhật trạng thái thanh toán (UC11) ===
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body; // paid, failed, refunded
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Không tìm thấy giao dịch.' });
    }

    payment.status = status || payment.status;
    if (status === 'paid' && !payment.paidAt) {
      payment.paidAt = new Date();
    }

    const updated = await payment.save();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái thanh toán.' });
  }
};
