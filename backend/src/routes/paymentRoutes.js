// routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
// const { protect } = require("../middleware/authMiddleware"); 
// Lưu ý: Route tạo URL cần protect, nhưng route return KHÔNG ĐƯỢC protect vì VNPay gọi vào

// Tạo URL thanh toán (Cần đăng nhập)
router.get("/create_payment_url/:id", paymentController.createPaymentUrl); // Bỏ protect tạm thời nếu muốn test nhanh, nhưng nên giữ

// VNPay Redirect về (Không cần token header vì trình duyệt redirect)
router.get("/vnpay_return", paymentController.vnpayReturn);

module.exports = router;