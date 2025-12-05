import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import SignContractModal from "../components/SignContractModal";

const API_BASE = "http://localhost:5000";

/* ======= TOAST COMPONENT ======= */
const Toast = ({ message, type = "success" }) => {
  if (!message) return null;
  const bgColor = type === "success" ? "bg-emerald-600" : "bg-red-600";
  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-2xl shadow-lg animate-slideIn z-50 text-sm font-medium`}
    >
      {message}
    </div>
  );
};

/* ======= HELPERS ======= */

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "--/--/----";

const formatCurrency = (v) =>
  (v || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 }) + " đ";

// Map trạng thái backend + cờ contractSigned/paymentDone sang UI status
const getUiStatus = (r) => {
  if (r.status === "cancelled") {
    return {
      key: "cancelled",
      label: "ĐÃ HỦY",
      className: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }
  if (r.status === "cancelling") {
    return {
      key: "cancelling",
      label: "ĐANG HỦY",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }
  if (r.paymentDone || r.status === "rented") {
    return {
      key: "completed",
      label: "HOÀN TẤT",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (r.status === "approved" && r.contractSigned && !r.paymentDone) {
    return {
      key: "waiting_payment",
      label: "CHỜ THANH TOÁN",
      className: "bg-sky-50 text-sky-700 border-sky-200",
    };
  }
  if (r.status === "approved" && !r.contractSigned) {
    return {
      key: "waiting_sign",
      label: "CHỜ KÝ HỢP ĐỒNG",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
  }
  return {
    key: "pending",
    label: "CHỜ DUYỆT",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
};

// Dùng cho filter
const statusFilterMatch = (filterKey, uiStatusKey) => {
  if (filterKey === "all") return true;
  if (filterKey === "processing") {
    return (
      uiStatusKey === "pending" ||
      uiStatusKey === "waiting_sign" ||
      uiStatusKey === "waiting_payment"
    );
  }
  if (filterKey === "completed") return uiStatusKey === "completed";
  if (filterKey === "cancelled") {
    return uiStatusKey === "cancelled" || uiStatusKey === "cancelling";
  }
  return true;
};

// Step: Duyệt -> Ký -> Thanh toán -> Hoàn tất
const getStepsState = (r) => ({
  approve: r.status === "approved" || r.status === "rented" || r.paymentDone,
  sign: r.contractSigned || r.paymentDone,
  pay: r.paymentDone,
});

const isPaidRental = (r) => !!r.paymentDone;

/* ======= MAIN PAGE ======= */

const MyRentals = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal ký hợp đồng
  const [selectedRental, setSelectedRental] = useState(null);
  const [signModalOpen, setSignModalOpen] = useState(false);

  // Loading cho hành động (tránh spam click)
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });

  // filter & sort
  const [statusFilter, setStatusFilter] = useState("all"); // all | processing | completed | cancelled
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 4000);
  };

  const fetchRentals = async () => {
    if (!token) return;
    if (rentals.length === 0) setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/rentals/my-rentals`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRentals(data || []);
    } catch (err) {
      console.error(err);
      showToast("Lỗi tải danh sách hợp đồng", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC XỬ LÝ KHI VNPAY REDIRECT VỀ ---
  useEffect(() => {
    if (!token) return;

    const query = new URLSearchParams(window.location.search);
    const status = query.get("status");

    if (status) {
      if (status === "success") {
        showToast("Thanh toán thành công! Hợp đồng đã hoàn tất.", "success");
      } else if (status === "failed") {
        showToast("Giao dịch thất bại hoặc bị hủy bỏ.", "error");
      } else if (status === "invalid") {
        showToast("Dữ liệu thanh toán không hợp lệ!", "error");
      }

      // Xóa query trên URL
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchRentals();
    } else {
      fetchRentals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- XỬ LÝ KÝ HỢP ĐỒNG ---
  const handleSignContract = (rental) => {
    setSelectedRental(rental);
    setSignModalOpen(true);
  };

  const onSignConfirm = async (text) => {
    if (!selectedRental) return;
    setActionLoading(true);
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${selectedRental._id}/sign`,
        { contractText: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Ký hợp đồng thành công");
      setSignModalOpen(false);
      setSelectedRental(null);
      fetchRentals();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi ký hợp đồng", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- XỬ LÝ THANH TOÁN ---
  const handlePaymentInit = async (id) => {
    setActionLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/payments/create_payment_url/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Không lấy được link thanh toán từ hệ thống.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Lỗi khởi tạo thanh toán",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Lọc + sắp xếp rentals để render
  const filteredRentals = useMemo(() => {
    let list = rentals.map((r) => ({
      ...r,
      _uiStatus: getUiStatus(r),
    }));

    list = list.filter((r) =>
      statusFilterMatch(statusFilter, r._uiStatus.key)
    );

    list.sort((a, b) => {
      const da = new Date(a.startDate || a.createdAt || 0).getTime();
      const db = new Date(b.startDate || b.createdAt || 0).getTime();
      return sortOrder === "newest" ? db - da : da - db;
    });

    return list;
  }, [rentals, statusFilter, sortOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50 pb-10">
      <Toast message={toast.message} type={toast.type} />

      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-[92px] pb-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-500 mb-1">
            Tài khoản của bạn
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-emerald-700 mb-1">
                Hợp đồng của tôi
              </h1>
              <p className="text-sm md:text-base text-emerald-900/80 max-w-xl">
                Theo dõi trạng thái hợp đồng, ký tên và thanh toán trực tuyến
                một cách an toàn.
              </p>
            </div>
            {rentals.length > 0 && (
              <div className="text-xs bg-white/70 border border-emerald-100 rounded-2xl px-3 py-2 shadow-sm inline-flex flex-col items-end">
                <span className="text-slate-500">Tổng số hợp đồng</span>
                <span className="text-sm font-semibold text-emerald-700">
                  {rentals.length} hợp đồng
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-5 pb-16 space-y-5">
        {/* FILTER BAR */}
        <section className="bg-white border border-emerald-100 rounded-2xl shadow-sm px-3 md:px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600 font-semibold mb-1">
              Bộ lọc hợp đồng
            </p>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <FilterChip
                label="Tất cả"
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              />
              <FilterChip
                label="Đang xử lý"
                active={statusFilter === "processing"}
                onClick={() => setStatusFilter("processing")}
              />
              <FilterChip
                label="Hoàn tất"
                active={statusFilter === "completed"}
                onClick={() => setStatusFilter("completed")}
              />
              <FilterChip
                label="Đã / đang hủy"
                active={statusFilter === "cancelled"}
                onClick={() => setStatusFilter("cancelled")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Sắp xếp:</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setSortOrder("newest")}
                className={`px-2.5 py-1 rounded-lg ${
                  sortOrder === "newest"
                    ? "bg-white shadow-sm text-emerald-700 font-semibold"
                    : "text-slate-600"
                }`}
              >
                Mới nhất
              </button>
              <button
                onClick={() => setSortOrder("oldest")}
                className={`px-2.5 py-1 rounded-lg ${
                  sortOrder === "oldest"
                    ? "bg-white shadow-sm text-emerald-700 font-semibold"
                    : "text-slate-600"
                }`}
              >
                Cũ nhất
              </button>
            </div>
          </div>
        </section>

        {/* LIST / STATES */}
        {loading ? (
          <MyRentalsSkeleton />
        ) : !filteredRentals.length ? (
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 text-center text-sm">
            <p className="font-semibold text-slate-800 mb-1">
              Chưa có hợp đồng nào
            </p>
            <p className="text-slate-500">
              Khi bạn đăng ký thuê căn hộ và được duyệt, hợp đồng sẽ hiển thị
              tại đây.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            {filteredRentals.map((r) => (
              <RentalCard
                key={r._id}
                rental={r}
                uiStatus={r._uiStatus}
                onSign={handleSignContract}
                onPay={handlePaymentInit}
                actionLoading={actionLoading}
              />
            ))}
          </section>
        )}
      </main>

      <SignContractModal
        open={signModalOpen}
        rental={selectedRental}
        defaultText={selectedRental?.contractText || ""}
        loading={actionLoading}
        onClose={() => {
          setSignModalOpen(false);
          setSelectedRental(null);
        }}
        onConfirm={onSignConfirm}
      />
    </div>
  );
};

export default MyRentals;

/* ======= SUB COMPONENTS ======= */

const FilterChip = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-lg border text-[11px] transition ${
      active
        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
        : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300 hover:text-emerald-700"
    }`}
  >
    {label}
  </button>
);

// Thanh hiển thị các bước: Duyệt → Ký → Thanh toán
const ContractSteps = ({ rental }) => {
  const steps = getStepsState(rental);

  const items = [
    { key: "approve", label: "Duyệt đơn", done: steps.approve },
    { key: "sign", label: "Ký hợp đồng", done: steps.sign },
    { key: "pay", label: "Thanh toán", done: steps.pay },
  ];

  return (
    <div className="flex items-center gap-2 text-[11px] text-slate-500">
      {items.map((step, idx) => (
        <React.Fragment key={step.key}>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] ${
                step.done
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : "border-slate-300 text-slate-400"
              }`}
            >
              {step.done ? "✓" : idx + 1}
            </span>
            <span
              className={step.done ? "text-emerald-700 font-medium" : ""}
            >
              {step.label}
            </span>
          </div>
          {idx < items.length - 1 && (
            <span className="w-6 h-px bg-slate-200" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const PaymentBadge = ({ rental }) => {
  const paid = isPaidRental(rental);
  if (paid) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Đã thanh toán
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
      Chưa thanh toán đủ
    </span>
  );
};

const RentalCard = ({ rental, uiStatus, onSign, onPay, actionLoading }) => {
  return (
    <article className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="px-4 md:px-5 py-4 md:py-4 flex flex-col gap-3">
        {/* TOP LINE: title + status */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
          <div className="space-y-1">
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              {rental.apartment?.title || "Căn hộ không tồn tại"}
            </h2>
            <p className="text-[11px] text-slate-500">
              Mã hợp đồng:{" "}
              <span className="font-medium text-slate-700">
                {rental.contractCode || rental._id?.slice(-6) || "N/A"}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border ${uiStatus.className}`}
            >
              {uiStatus.label}
            </span>
            <PaymentBadge rental={rental} />
          </div>
        </div>

        {/* MIDDLE: dates + total + steps */}
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs md:text-sm text-slate-600">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">📅</span>
                <span>
                  Bắt đầu:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDate(rental.startDate)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">📅</span>
                <span>
                  Kết thúc:{" "}
                  <span className="font-semibold text-slate-800">
                    {formatDate(rental.endDate)}
                  </span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                Tổng giá trị hợp đồng
              </p>
              <p className="text-lg md:text-xl font-bold text-emerald-600">
                {formatCurrency(rental.totalPrice)}
              </p>
            </div>
          </div>

          <ContractSteps rental={rental} />
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Nếu bạn có thắc mắc về hợp đồng này, vui lòng liên hệ ban quản lý
            tòa nhà để được hỗ trợ.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            {rental.status === "approved" && !rental.contractSigned && (
              <button
                onClick={() => onSign(rental)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-1"
              >
                ✍️ Ký hợp đồng
              </button>
            )}

            {rental.contractSigned &&
              !rental.paymentDone &&
              rental.status !== "cancelled" && (
                <button
                  onClick={() => onPay(rental._id)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                >
                  💳 {actionLoading ? "Đang xử lý..." : "Thanh toán"}
                </button>
              )}

            {rental.paymentDone && (
              <span className="text-[11px] md:text-xs text-emerald-700 font-semibold">
                Hợp đồng đã được thanh toán đầy đủ.
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

/* Skeleton loading cho list hợp đồng */
const MyRentalsSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-4 animate-pulse"
      >
        <div className="flex justify-between gap-4 mb-3">
          <div className="space-y-2">
            <div className="h-4 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-32 bg-slate-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-24 bg-slate-200 rounded-full" />
            <div className="h-6 w-28 bg-slate-200 rounded-full" />
          </div>
        </div>
        <div className="h-3 w-full bg-slate-200 rounded mb-2" />
        <div className="h-3 w-1/2 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-1/3 bg-slate-200 rounded" />
      </div>
    ))}
  </div>
);
