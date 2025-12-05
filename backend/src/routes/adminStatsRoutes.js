const express = require("express");
const router = express.Router();

const { requireAuth, requireAdmin } = require("../middleware/auth");

const Apartment = require("../models/apartmentModel");
const Rental = require("../models/rentalModel");
const Invoice = require("../models/invoiceModel");
const News = require("../models/newsModel");
const User = require("../models/userModel");

// =======================================
// ⭐ GET /api/admin/stats
// =======================================
router.get("/stats", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [apartments, rentals, invoices, news, users] = await Promise.all([
      Apartment.find(),
      Rental.find(),
      Invoice.find(),
      News.find(),
      User.find(),
    ]);

    // -----------------------------
    // 1. Stats căn hộ / người dùng / tin tức / đơn thuê
    // -----------------------------
    const apartmentStats = {
      total: apartments.length,
      available: apartments.filter((a) => a.status === "available").length,
      rented: apartments.filter((a) => a.status === "rented").length,
      reserved: apartments.filter((a) => a.status === "reserved").length,
    };

    const rentalStats = {
      total: rentals.length,
      pending: rentals.filter((r) => r.status === "pending").length,
      approved: rentals.filter((r) => r.status === "approved").length,
      rented: rentals.filter((r) => r.status === "rented").length,
      cancelling: rentals.filter((r) => r.status === "cancelling").length,
      cancelled: rentals.filter((r) => r.status === "cancelled").length,
    };

    const newsStats = {
      total: news.length,
      active: news.filter((n) => n.status === true).length,
      inactive: news.filter((n) => n.status === false).length,
    };

    const userStats = {
      total: users.length,
      admins: users.filter((u) => u.role === "admin").length,
      customers: users.filter((u) => u.role !== "admin").length,
    };

    // -----------------------------
    // 2. Doanh thu: tháng hiện tại + tháng trước
    // -----------------------------
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    let prevMonth = curMonth - 1;
    let prevYear = curYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = curYear - 1;
    }

    // ⚡ TÍNH DOANH THU TỪ TẤT CẢ HÓA ĐƠN KHÔNG BỊ HỦY
    // (unpaid + paid). Sau này nếu bạn muốn chỉ tính tiền đã thu,
    // đổi lại thành: inv.status === "paid"
    const revenueInvoices = invoices.filter(
      (inv) => inv.status !== "cancelled"
    );

    const invoicesCurrentMonth = revenueInvoices.filter(
      (inv) => inv.month === curMonth && inv.year === curYear
    );

    const revenueCurrentMonth = invoicesCurrentMonth.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    const invoicesPrevMonth = revenueInvoices.filter(
      (inv) => inv.month === prevMonth && inv.year === prevYear
    );

    const revenuePrevMonth = invoicesPrevMonth.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0),
      0
    );

    // Tính tăng trưởng %
    let revenueGrowth = null;
    if (revenuePrevMonth > 0) {
      revenueGrowth = Math.round(
        ((revenueCurrentMonth - revenuePrevMonth) / revenuePrevMonth) * 100
      );
    }

    // -----------------------------
    // 3. Doanh thu 6 tháng gần nhất (dùng invoice không bị hủy)
    // -----------------------------
    // -----------------------------
// 3. Doanh thu 12 tháng gần nhất (dùng invoice không bị hủy)
// -----------------------------
const monthlyRevenueMap = {};

revenueInvoices.forEach((inv) => {
  if (!inv.month || !inv.year) return;

  const key = `${inv.year}-${String(inv.month).padStart(2, "0")}`;
  monthlyRevenueMap[key] =
    (monthlyRevenueMap[key] || 0) + (inv.totalAmount || 0);
});

// Tạo đủ 12 tháng gần nhất (kể cả tháng không có hóa đơn)
const monthlyRevenue = [];
for (let i = 11; i >= 0; i--) {
  const d = new Date(curYear, curMonth - 1 - i, 1); // lùi i tháng
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const key = `${year}-${String(month).padStart(2, "0")}`;

  monthlyRevenue.push({
    year,
    month,
    total: monthlyRevenueMap[key] || 0, // nếu không có hóa đơn, xem như 0
  });
}

    // -----------------------------
    // 4. Hoạt động gần đây
    // -----------------------------
    const recentRentals = rentals
      .map((r) => ({
        type: "rental",
        typeLabel: "Đơn thuê",
        title: r.apartment?.title || "Đơn thuê căn hộ",
        status: r.status,
        date: r.createdAt || r.startDate,
      }))
      .filter((x) => x.date);

    const recentInvoices = invoices
      .map((inv) => ({
        type: "invoice",
        typeLabel: "Hóa đơn",
        title: inv.apartment?.title || "Hóa đơn căn hộ",
        status: inv.status,
        date: inv.createdAt,
      }))
      .filter((x) => x.date);

    const recentNews = news
      .map((n) => ({
        type: "news",
        typeLabel: "Tin tức",
        title: n.title,
        status: n.status ? "active" : "inactive",
        date: n.createdAt,
      }))
      .filter((x) => x.date);

    const recent = [...recentRentals, ...recentInvoices, ...recentNews]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);

    // -----------------------------
    // 🔥 Response
    // -----------------------------
    res.json({
      apartments: apartmentStats,
      rentals: rentalStats,
      news: newsStats,
      users: userStats,

      revenue: {
        currentMonth: revenueCurrentMonth,
        previousMonth: revenuePrevMonth,
        growthPercent: revenueGrowth,
        currentMonthLabel: `T${curMonth}/${curYear}`,
        previousMonthLabel: `T${prevMonth}/${prevYear}`,
        monthlyRevenue,
      },

      recent,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
