import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const API_BASE = "http://localhost:5000";

/* ============== TOAST ============== */
const Toast = ({ message, type }) => {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-2 rounded-2xl text-sm font-semibold shadow-lg z-50
        ${
          type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}
    >
      {message}
    </div>
  );
};

const AdminDashboard = () => {
  const { token, user } = useAuth() || {};

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [error, setError] = useState("");

  // auto refresh & filters
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activityFilter, setActivityFilter] = useState("all"); // all | rental | invoice | other
  const [revenueRange, setRevenueRange] = useState(6); // 3 | 6 | 12 tháng gần nhất

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type }), 2500);
  };

  const fetchStats = async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError("");
      const { data } = await axios.get(`${API_BASE}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Không thể tải dữ liệu dashboard.");
      showToast("Không thể tải dữ liệu dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchStats();
  }, [token]);

  // Auto refresh mỗi 5 phút (có thể tắt)
  useEffect(() => {
    if (!autoRefresh || !token) return;

    const id = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000); // 5 phút

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, token]);

  // ====== TÍNH TOÁN THÊM ======
  const derived = useMemo(() => {
    if (!stats) return {};

    const totalApt = stats.apartments?.total || 0;
    const rentedApt = stats.apartments?.rented || 0;

    const occupancyRate = totalApt
      ? Math.round((rentedApt / totalApt) * 100)
      : 0;

    const newsTotal = stats.news?.total || 0;
    const newsActive = stats.news?.active || 0;
    const newsRate = newsTotal ? Math.round((newsActive / newsTotal) * 100) : 0;

    const totalUsers = stats.users?.total || 0;
    const admins = stats.users?.admins || 0;
    const residents = stats.users?.customers || 0;

    const totalRentals = stats.rentals?.total || 0;
    const pendingRentals = stats.rentals?.pending || 0;
    const rentedRentals = stats.rentals?.rented || 0;

    const rentalConversionRate = totalRentals
      ? Math.round((rentedRentals / totalRentals) * 100)
      : 0;

    // tính tăng trưởng doanh thu nếu có previousMonth
    let revenueGrowth = null;
    let revenueGrowthLabel = "";
    if (
      stats.revenue?.currentMonth != null &&
      stats.revenue?.previousMonth != null &&
      stats.revenue.previousMonth > 0
    ) {
      revenueGrowth = Math.round(
        ((stats.revenue.currentMonth - stats.revenue.previousMonth) /
          stats.revenue.previousMonth) *
          100
      );
      revenueGrowthLabel =
        revenueGrowth >= 0
          ? `↑ +${revenueGrowth}% so với tháng trước`
          : `↓ ${revenueGrowth}% so với tháng trước`;
    }

    return {
      occupancyRate,
      newsRate,
      totalUsers,
      admins,
      residents,
      totalRentals,
      pendingRentals,
      rentalConversionRate,
      revenueGrowth,
      revenueGrowthLabel,
    };
  }, [stats]);

  // lọc hoạt động gần đây theo type
  const filteredRecent = useMemo(() => {
    if (!stats?.recent) return [];
    if (activityFilter === "all") return stats.recent;

    if (activityFilter === "other") {
      return stats.recent.filter(
        (i) => i.type !== "rental" && i.type !== "invoice"
      );
    }

    return stats.recent.filter((i) => i.type === activityFilter);
  }, [stats, activityFilter]);

  // cắt dữ liệu doanh thu theo range (client-side)
  const revenueData = useMemo(() => {
    const arr = stats?.revenue?.monthlyRevenue || [];
    if (!arr.length) return [];
    // luôn lấy N tháng gần nhất, dù mảng ngắn hay dài
    const start = Math.max(0, arr.length - revenueRange);
    return arr.slice(start);
  }, [stats, revenueRange]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl shadow-lg p-6">
          <p className="text-sm font-semibold text-red-600 mb-1">
            Truy cập bị từ chối
          </p>
          <p className="text-sm text-slate-600">
            Bạn không có quyền truy cập dashboard quản trị. Vui lòng đăng nhập
            bằng tài khoản admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <Toast message={toast.message} type={toast.type} />

      {/* TOP BAR */}
      <header className="fixed inset-x-0 top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-500 font-semibold">
              Admin · Overview
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base md:text-lg font-semibold text-slate-900">
                Dashboard tổng quan
              </h1>
              {stats && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {stats.users?.total || 0} tài khoản
                </span>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </span>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">
                {user?.name || user?.email || "Admin"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-10 space-y-8">
        {/* INTRO / ACTIONS */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 shadow-sm px-4 py-4 md:px-6 md:py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 opacity-40">
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_#22c55e33,_transparent_60%)]" />
          </div>

          <div className="relative z-10">
            <nav className="flex items-center gap-1 text-xs text-emerald-600 mb-1">
              <span className="font-medium">Dashboard</span>
              <span className="mx-1 text-emerald-300">/</span>
              <span className="text-emerald-800 font-semibold">
                Tổng quan hệ thống
              </span>
            </nav>
            <h2 className="text-base md:text-lg font-semibold text-slate-900 mb-1.5">
              Tình hình hoạt động của SMARTBUILDING
            </h2>
            <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
              Theo dõi tổng quan căn hộ, đơn thuê, tin tức và doanh thu hóa đơn
              – tất cả trong một màn hình.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-start md:items-end gap-2 text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={fetchStats}
                className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-white text-slate-800 text-xs md:text-sm font-semibold shadow-sm border border-slate-200 hover:bg-slate-50"
              >
                Làm mới dữ liệu
              </button>
              <button
                onClick={() => setAutoRefresh((v) => !v)}
                className={`inline-flex items-center justify-center px-3 py-2 rounded-2xl text-xs font-semibold border shadow-sm ${
                  autoRefresh
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-200"
                }`}
              >
                {autoRefresh ? "Tự động cập nhật: Bật" : "Tự động cập nhật: Tắt"}
              </button>
            </div>
            {stats?.revenue && (
              <span className="text-[11px] text-slate-500">
                Kỳ hiện tại: {stats.revenue.currentMonthLabel}
              </span>
            )}
          </div>
        </section>

        {/* LOADING / ERROR */}
        {loading && <SkeletonDashboard />}

        {!loading && error && !stats && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-md p-6 text-center text-sm">
            <p className="text-red-600 font-semibold mb-2">{error}</p>
            <button
              onClick={fetchStats}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700"
            >
              Thử tải lại
            </button>
          </div>
        )}

        {!loading && stats && (
          <>
            {/* HÀNG 1: KPI CHÍNH */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Tổng căn hộ"
                value={stats.apartments.total}
                sub={`${stats.apartments.available} còn trống`}
              />
              <StatCard
                label="Đơn thuê"
                value={stats.rentals.total}
                sub={`${stats.rentals.pending} đang chờ duyệt`}
              />
              <StatCard
                label="Tin tức"
                value={stats.news.total}
                sub={`${stats.news.active} đang hiển thị`}
              />
              <StatCard
                label="Doanh thu tháng này"
                value={`${stats.revenue.currentMonth.toLocaleString()} đ`}
                sub={
                  derived.revenueGrowthLabel ||
                  stats.revenue.currentMonthLabel
                }
                highlight
              />
            </section>

            {/* HÀNG 2: TỈ LỆ + REVENUE CHART */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* TỈ LỆ / TỔNG QUAN */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm space-y-4">
                <h3 className="font-semibold text-gray-800">
                  Tỉ lệ & tổng quan nhanh
                </h3>

                {/* Occupancy */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Tỉ lệ lấp đầy căn hộ
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {derived.occupancyRate}%{" "}
                      <span className="text-xs text-gray-500">
                        ({stats.apartments.rented}/{stats.apartments.total})
                      </span>
                    </p>
                  </div>
                  <ProgressCircle value={derived.occupancyRate} />
                </div>

                {/* News */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Tin tức đang hiển thị
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {derived.newsRate}%{" "}
                      <span className="text-xs text-gray-500">
                        ({stats.news.active}/{stats.news.total})
                      </span>
                    </p>
                  </div>
                  <ProgressBar value={derived.newsRate} color="emerald" />
                </div>

                {/* Users */}
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Tài khoản hệ thống
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {derived.totalUsers} người dùng
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {derived.admins} admin · {derived.residents} cư dân
                    </p>
                  </div>
                </div>
              </div>

              {/* CHART DOANH THU */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-2 gap-2">
                  <h3 className="font-semibold text-gray-800">
                    Doanh thu theo tháng
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline text-[11px] text-gray-500">
                      Đơn vị: VNĐ
                    </span>
                    <div className="flex items-center gap-1 text-[11px] bg-slate-50 rounded-xl p-1 border border-slate-200">
                      {[3, 6, 12].map((n) => (
                        <button
                          key={n}
                          onClick={() => setRevenueRange(n)}
                          className={`px-2 py-1 rounded-lg ${
                            revenueRange === n
                              ? "bg-white shadow-sm text-emerald-700 font-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {n}T
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {revenueData.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Chưa có dữ liệu hóa đơn.
                  </p>
                ) : (
                  <div className="h-52 flex flex-col justify-end">
                    <RevenueBarChart data={revenueData} />
                  </div>
                )}
              </div>
            </section>

            {/* HÀNG 3: ĐƠN THUÊ + HOẠT ĐỘNG GẦN ĐÂY */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* RENTAL STATUS DETAIL */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Trạng thái đơn thuê
                </h3>

                <div className="space-y-2 text-xs">
                  <StatusRow
                    label="Đang chờ duyệt"
                    value={stats.rentals.pending}
                    color="text-yellow-700 bg-yellow-50"
                  />
                  <StatusRow
                    label="Đã duyệt"
                    value={stats.rentals.approved}
                    color="text-sky-700 bg-sky-50"
                  />
                  <StatusRow
                    label="Đang thuê"
                    value={stats.rentals.rented}
                    color="text-emerald-700 bg-emerald-50"
                  />
                  <StatusRow
                    label="Đang chờ hủy"
                    value={stats.rentals.cancelling}
                    color="text-orange-700 bg-orange-50"
                  />
                  <StatusRow
                    label="Đã hủy"
                    value={stats.rentals.cancelled}
                    color="text-red-700 bg-red-50"
                  />
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500 mb-1">
                    Tỉ lệ chuyển đổi thành hợp đồng đang thuê
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-emerald-700">
                      {derived.rentalConversionRate}%
                    </span>
                    <div className="flex-1">
                      <ProgressBar
                        value={derived.rentalConversionRate}
                        color="sky"
                      />
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {derived.totalRentals} đơn tổng ·{" "}
                        {derived.pendingRentals} đang chờ duyệt
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HOẠT ĐỘNG GẦN ĐÂY */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-sm">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="font-semibold text-gray-800">
                    Hoạt động gần đây
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] bg-slate-50 rounded-xl p-1 border border-slate-200">
                    <FilterChip
                      label="Tất cả"
                      active={activityFilter === "all"}
                      onClick={() => setActivityFilter("all")}
                    />
                    <FilterChip
                      label="Đơn thuê"
                      active={activityFilter === "rental"}
                      onClick={() => setActivityFilter("rental")}
                    />
                    <FilterChip
                      label="Hóa đơn"
                      active={activityFilter === "invoice"}
                      onClick={() => setActivityFilter("invoice")}
                    />
                    <FilterChip
                      label="Khác"
                      active={activityFilter === "other"}
                      onClick={() => setActivityFilter("other")}
                    />
                  </div>
                </div>

                {filteredRecent.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Chưa có hoạt động nào gần đây với bộ lọc hiện tại.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredRecent.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-emerald-50/60 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                              item.type === "rental"
                                ? "bg-sky-50 text-sky-700 border-sky-100"
                                : item.type === "invoice"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-100"
                            }`}
                          >
                            {item.typeLabel}
                          </span>
                          <span className="text-sm text-gray-800 line-clamp-1">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">
                          {new Date(item.date).toLocaleString("vi-VN")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;

/* ====== COMPONENT PHỤ ====== */

const StatCard = ({ label, value, sub, highlight }) => (
  <div
    className={`rounded-2xl px-5 py-4 shadow-sm border text-sm ${
      highlight
        ? "bg-emerald-600 text-white border-emerald-600"
        : "bg-white text-slate-900 border-slate-200"
    }`}
  >
    <p
      className={`text-xs mb-1 ${
        highlight ? "text-emerald-100" : "text-slate-500"
      }`}
    >
      {label}
    </p>
    <p className="text-2xl font-bold leading-tight">{value}</p>
    {sub && (
      <p
        className={`mt-1 text-xs ${
          highlight ? "text-emerald-100/80" : "text-slate-500"
        }`}
      >
        {sub}
      </p>
    )}
  </div>
);

const StatusRow = ({ label, value, color }) => (
  <li className="flex items-center justify-between py-0.5">
    <span className="text-gray-700">{label}</span>
    <span
      className={`min-w-[40px] text-center px-2 py-1 rounded-full text-[11px] font-semibold ${color}`}
    >
      {value}
    </span>
  </li>
);

/* Filter chip cho hoạt động gần đây */
const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded-lg transition ${
      active
        ? "bg-white shadow-sm text-emerald-700 font-semibold"
        : "text-gray-600 hover:text-emerald-700"
    }`}
  >
    {label}
  </button>
);

/* Vòng tròn phần trăm đơn giản (CSS) */
const ProgressCircle = ({ value }) => {
  const v = Math.max(0, Math.min(100, value || 0));
  const rotation = (v / 100) * 180; // half circle

  return (
    <div className="relative w-12 h-6 overflow-hidden">
      <div className="absolute inset-0 rounded-b-full bg-slate-100" />
      <div
        className="absolute inset-0 origin-bottom bg-gradient-to-r from-emerald-400 to-emerald-600"
        style={{
          clipPath: "inset(0 0 50% 0)",
          transformOrigin: "50% 100%",
          transform: `rotate(${rotation}deg)`,
        }}
      />
      <div className="absolute inset-0 flex items-end justify-center">
        <span className="text-[10px] font-semibold text-emerald-700 bg-white/90 px-1.5 py-0.5 rounded-full shadow-sm">
          {v}%
        </span>
      </div>
    </div>
  );
};

/* Thanh progress ngang */
const ProgressBar = ({ value, color = "emerald" }) => {
  const v = Math.max(0, Math.min(100, value || 0));
  const colorClass =
    color === "sky"
      ? "bg-sky-500"
      : color === "amber"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClass} rounded-full transition-all`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
};

/* Biểu đồ cột doanh thu dùng Recharts (mỗi tháng 1 màu, Y không bị cắt) */
const RevenueBarChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const chartData = data.map((m) => ({
    name: `T${m.month}`, // label trục X
    total: m.total, // giá trị cột
    fullLabel: `Tháng ${m.month}/${m.year}`,
  }));

  const COLORS = [
    "#22c55e",
    "#0ea5e9",
    "#f97316",
    "#a855f7",
    "#e11d48",
    "#14b8a6",
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        barSize={32}
        margin={{ top: 10, right: 10, left: 40, bottom: 0 }} // left 40 để không cắt chữ
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          tickFormatter={(v) => v.toLocaleString("vi-VN")}
          axisLine={{ stroke: "#e5e7eb" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            borderColor: "#e5e7eb",
          }}
          formatter={(value) => `${Number(value).toLocaleString("vi-VN")} đ`}
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.fullLabel || ""
          }
        />
        <Bar dataKey="total" radius={[10, 10, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={COLORS[index % COLORS.length]} // mỗi tháng 1 màu
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

/* Skeleton loading cho dashboard */
const SkeletonDashboard = () => (
  <div className="space-y-5 animate-pulse">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-2xl px-5 py-4 shadow-sm border border-slate-100 bg-slate-50/60"
        >
          <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
          <div className="h-7 w-20 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-32 bg-slate-200 rounded" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="h-3 w-32 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
              <div className="h-6 w-12 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
        <div className="h-4 w-40 bg-slate-200 rounded mb-4" />
        <div className="h-40 w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl" />
      </div>
    </div>
  </div>
);
