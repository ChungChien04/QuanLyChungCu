const express = require("express");
const router = express.Router();

const { protect, admin } = require("../middleware/authMiddleware");

const Apartment = require("../models/apartmentModel");
const Rental = require("../models/rentalModel");
const Invoice = require("../models/invoiceModel");
const News = require("../models/newsModel");
const User = require("../models/userModel");
const Review = require("../models/reviewModel");


// =======================================
// ⭐ 1. GET /api/admin/stats  — Dashboard tổng quan
// =======================================
router.get("/stats", protect, admin, async (req, res) => {
  try {
    const [apartments, rentals, invoices, news, users] = await Promise.all([
      Apartment.find(),
      Rental.find(),
      Invoice.find(),
      News.find(),
      User.find(),
    ]);

    // -----------------------------  
    // 1️⃣ Thống kê căn hộ
    // -----------------------------
    const apartmentStats = {
      total: apartments.length,
      available: apartments.filter(a => a.status === "available").length,
      rented: apartments.filter(a => a.status === "rented").length,
      reserved: apartments.filter(a => a.status === "reserved").length,
    };

    // -----------------------------  
    // 2️⃣ Thống kê đơn thuê
    // -----------------------------
    const rentalStats = {
      total: rentals.length,
      pending: rentals.filter(r => r.status === "pending").length,
      approved: rentals.filter(r => r.status === "approved").length,
      rented: rentals.filter(r => r.status === "rented").length,
      cancelling: rentals.filter(r => r.status === "cancelling").length,
      cancelled: rentals.filter(r => r.status === "cancelled").length,
    };

    // -----------------------------  
    // 3️⃣ Thống kê tin tức
    // -----------------------------
    const newsStats = {
      total: news.length,
      active: news.filter(n => n.status === true).length,
      inactive: news.filter(n => n.status === false).length,
    };

    // -----------------------------  
    // 4️⃣ Thống kê user
    // -----------------------------
    const userStats = {
      total: users.length,
      admins: users.filter(u => u.role === "admin").length,
      customers: users.filter(u => u.role !== "admin").length,
    };

    // -----------------------------  
    // 5️⃣ Doanh thu tháng này + tháng trước
    // -----------------------------
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    let prevMonth = curMonth - 1;
    let prevYear = curYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    const revenueInvoices = invoices.filter(inv => inv.status !== "cancelled");

    const invoicesCurrent = revenueInvoices.filter(
      inv => inv.month === curMonth && inv.year === curYear
    );

    const invoicesPrev = revenueInvoices.filter(
      inv => inv.month === prevMonth && inv.year === prevYear
    );

    const revenueCurrentMonth = invoicesCurrent.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0), 0
    );

    const revenuePrevMonth = invoicesPrev.reduce(
      (sum, inv) => sum + (inv.totalAmount || 0), 0
    );

    let revenueGrowth = null;
    if (revenuePrevMonth > 0) {
      revenueGrowth = Math.round(
        ((revenueCurrentMonth - revenuePrevMonth) / revenuePrevMonth) * 100
      );
    }

    // -----------------------------  
    // 6️⃣ Doanh thu 12 tháng gần nhất
    // -----------------------------
    const monthlyRevenueMap = {};

    revenueInvoices.forEach(inv => {
      if (!inv.month || !inv.year) return;
      const key = `${inv.year}-${String(inv.month).padStart(2, "0")}`;
      monthlyRevenueMap[key] =
        (monthlyRevenueMap[key] || 0) + (inv.totalAmount || 0);
    });

    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const key = `${year}-${String(month).padStart(2, "0")}`;

      monthlyRevenue.push({
        year,
        month,
        total: monthlyRevenueMap[key] || 0,
      });
    }

    // -----------------------------  
    // 7️⃣ Hoạt động gần đây
    // -----------------------------
    const recentRentals = rentals.map(r => ({
      type: "rental",
      typeLabel: "Đơn thuê",
      title: r.apartment?.title || "Đơn thuê căn hộ",
      status: r.status,
      date: r.createdAt || r.startDate,
    }));

    const recentInvoices = invoices.map(inv => ({
      type: "invoice",
      typeLabel: "Hóa đơn",
      title: inv.apartment?.title || "Hóa đơn căn hộ",
      status: inv.status,
      date: inv.createdAt,
    }));

    const recentNews = news.map(n => ({
      type: "news",
      typeLabel: "Tin tức",
      title: n.title,
      status: n.status ? "active" : "inactive",
      date: n.createdAt,
    }));

    const recent = [...recentRentals, ...recentInvoices, ...recentNews]
      .filter(x => x.date)
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


// =======================================
// ⭐ 2. GET /api/admin/summary-counts — Badge cảnh báo Admin Navbar
// =======================================
router.get("/summary-counts", protect, admin, async (req, res) => {
  try {
    const apartmentsPending = await Apartment.countDocuments({
      status: "reserved",
    });

    const rentalsPending = await Rental.countDocuments({
      status: { $in: ["pending", "cancelling"] },
    });

    const invoicesPending = await Invoice.countDocuments({
      status: "paid",
      isViewedByAdmin: false,
    });

    const newsPending = await News.countDocuments({ status: false });

    const reviewsPending = await Review.countDocuments({
      $or: [
        { reply: { $exists: false } },
        { "reply.content": { $in: [null, ""] } },
      ],
    });

    res.json({
      apartmentsPending,
      rentalsPending,
      invoicesPending,
      newsPending,
      reviewsPending,
    });
  } catch (err) {
    console.error("summary-counts error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy summary admin." });
  }
});


module.exports = router;
