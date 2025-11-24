const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { protect, admin } = require("../middleware/authMiddleware");

// =========================================
// 👮 ADMIN ROUTES (Quản lý hóa đơn)
// =========================================

// 1. Lấy cài đặt giá hiện tại (Điện, Nước, Phí dịch vụ...)
router.get("/settings", protect, admin, invoiceController.getSettings);

// 2. Cập nhật cài đặt giá
router.put("/settings", protect, admin, invoiceController.updateSettings);

// 3. Lấy danh sách các căn đang thuê để chuẩn bị lập hóa đơn
router.get("/prepare", protect, admin, invoiceController.prepareInvoices);

// 4. Tạo và Lưu danh sách hóa đơn vào Database
router.post("/create", protect, admin, invoiceController.createInvoices);


// =========================================
// 👤 USER ROUTES (Cư dân)
// =========================================

// 5. Khách xem danh sách hóa đơn của một hợp đồng cụ thể
router.get("/my-invoices/:rentalId", protect, invoiceController.getMyInvoices);
router.get("/my-unpaid-count", protect, invoiceController.getUnpaidCount);
// 6. Lấy danh sách hóa đơn (Admin)
router.get("/admin/all", protect, admin, invoiceController.getAdminInvoices);
module.exports = router;