const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect, admin } = require("../middleware/authMiddleware");
// Dùng khi khách hàng mới thuê nhà, cần đóng tiền cọc/tiền thuê lần đầu
router.get("/create_payment_url/:id", protect, paymentController.createPaymentUrl);

// Dùng khi khách hàng đóng tiền điện, nước, phí dịch vụ hàng tháng
// Route này sẽ gọi hàm createInvoicePaymentUrl bên controller
router.get("/create_invoice_payment_url/:id", protect, paymentController.createInvoicePaymentUrl);

// VNPay sẽ gọi vào đây sau khi khách thanh toán xong.
// Controller sẽ tự kiểm tra mã "INV-" để biết là hóa đơn hay hợp đồng.
router.get("/vnpay_return", paymentController.vnpayReturn);

// Admin: Thanh toán thủ công
router.put("/admin/manual-pay-rental/:id", protect, admin, paymentController.manualPayRental);
router.put("/admin/manual-pay-invoice/:id", protect, admin, paymentController.manualPayInvoice);
module.exports = router;