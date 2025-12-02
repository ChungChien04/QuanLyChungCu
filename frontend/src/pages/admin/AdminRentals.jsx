import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const API_BASE = "http://localhost:5000";

/* ============================
   TOAST
============================= */
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

const AdminRentals = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type }), 2500);
  };

  // ============================
  // FETCH ALL RENTALS
  // ============================
  const fetchRentals = async () => {
    try {
      if (!token) return;
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/rentals/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(res.data || []);
    } catch (err) {
      console.error("Fetch Rentals Error:", err);
      showToast("Lỗi tải danh sách đơn thuê.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRentals();
  }, [token]);

  // ============================
  // ACTIONS
  // ============================
  const handleApprove = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Đã duyệt đơn thuê!");
      fetchRentals();
    } catch (err) {
      console.error("Approve Error:", err.response?.data || err);
      showToast("Lỗi duyệt đơn thuê.", "error");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đơn này?")) return;

    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/cancel-admin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Đã cập nhật trạng thái hủy.", "success");
      fetchRentals();
    } catch (err) {
      console.error("Cancel Error:", err.response?.data || err);
      showToast("Lỗi hủy đơn thuê.", "error");
    }
  };

  // ============================
  // STATS
  // ============================
  const { total, pending, approved, rented, cancelling, cancelled } =
    useMemo(() => {
      const total = rentals.length;
      let pending = 0,
        approved = 0,
        rented = 0,
        cancelling = 0,
        cancelled = 0;
      rentals.forEach((r) => {
        if (r.status === "pending") pending++;
        else if (r.status === "approved") approved++;
        else if (r.status === "rented") rented++;
        else if (r.status === "cancelling") cancelling++;
        else if (r.status === "cancelled") cancelled++;
      });
      return { total, pending, approved, rented, cancelling, cancelled };
    }, [rentals]);

  // Sort mới nhất lên trên
  const sortedRentals = useMemo(
    () =>
      [...rentals].sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate).getTime() -
          new Date(a.createdAt || a.startDate).getTime()
      ),
    [rentals]
  );

  const renderStatusBadge = (status) => {
    const map = {
      pending: {
        label: "Đang chờ",
        cls: "bg-yellow-50 text-yellow-700 border-yellow-200",
      },
      approved: {
        label: "Đã duyệt",
        cls: "bg-sky-50 text-sky-700 border-sky-200",
      },
      rented: {
        label: "Đang thuê",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      cancelling: {
        label: "Đang chờ hủy",
        cls: "bg-orange-50 text-orange-700 border-orange-200",
      },
      cancelled: {
        label: "Đã hủy",
        cls: "bg-red-50 text-red-700 border-red-200",
      },
    };

    const info = map[status] || {
      label: status,
      cls: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${info.cls}`}
      >
        {info.label}
      </span>
    );
  };

  const primaryBtn =
    "inline-flex items-center justify-center px-4 py-2 text-xs md:text-sm rounded-full font-semibold shadow-sm";
  const btnApprove = `${primaryBtn} bg-emerald-600 text-white hover:bg-emerald-700`;
  const btnDanger = `${primaryBtn} bg-red-500 text-white hover:bg-red-600`;
  const btnGhost =
    "inline-flex items-center justify-center px-4 py-2 text-xs md:text-sm rounded-full font-medium border border-gray-200 text-gray-700 bg-white hover:bg-gray-50";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <Toast message={toast.message} type={toast.type} />

      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Admin panel
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1">
            Quản lý đơn thuê
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-xl">
            Kiểm tra, duyệt yêu cầu thuê và xử lý yêu cầu hủy của người dùng.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* STATS + REFRESH */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-emerald-700">
                Dashboard /{" "}
              </span>
              <span className="font-semibold text-slate-900">
                Quản lý đơn thuê
              </span>
            </div>

            <button onClick={fetchRentals} className={btnGhost}>
              Làm mới danh sách
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5">
              <p className="text-xs text-slate-500 mb-1">Tổng đơn</p>
              <p className="text-xl font-semibold text-slate-900">{total}</p>
            </div>
            <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm px-4 py-3.5">
              <p className="text-xs text-yellow-700 mb-1">Đang chờ duyệt</p>
              <p className="text-xl font-semibold text-yellow-700">
                {pending}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm px-4 py-3.5">
              <p className="text-xs text-sky-700 mb-1">Đã duyệt</p>
              <p className="text-xl font-semibold text-sky-700">{approved}</p>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3.5">
              <p className="text-xs text-emerald-700 mb-1">Đang thuê</p>
              <p className="text-xl font-semibold text-emerald-700">
                {rented}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-4 py-3.5">
              <p className="text-xs text-red-700 mb-1">Đã hủy / đang hủy</p>
              <p className="text-xl font-semibold text-red-700">
                {cancelling + cancelled}
              </p>
            </div>
          </div>
        </section>

        {/* LIST */}
        <section className="space-y-4">
          {loading && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 text-center text-gray-600 text-sm">
              Đang tải danh sách đơn thuê...
            </div>
          )}

          {!loading && !sortedRentals.length && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-6 text-center text-gray-500 text-sm">
              Chưa có đơn thuê nào.
            </div>
          )}

          {!loading &&
            sortedRentals.map((r) => (
              <div
                key={r._id}
                className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                {/* INFO */}
                <div className="flex-1 text-sm space-y-1.5">
                  <p>
                    <span className="font-semibold text-gray-800">
                      Người thuê:
                    </span>{" "}
                    {r.user?.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({r.user?.email})
                    </span>
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Căn hộ:
                    </span>{" "}
                    {r.apartment?.title}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Ngày thuê:
                    </span>{" "}
                    {new Date(r.startDate).toLocaleDateString("vi-VN")} –{" "}
                    {new Date(r.endDate).toLocaleDateString("vi-VN")}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Tổng tiền:
                    </span>{" "}
                    <span className="text-emerald-700 font-semibold">
                      {r.totalPrice?.toLocaleString()} đ
                    </span>
                  </p>

                  <p className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-800">
                      Trạng thái:
                    </span>
                    {renderStatusBadge(r.status)}
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0 md:ml-6">
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(r._id)}
                        className={btnApprove}
                      >
                        Duyệt đơn
                      </button>

                      <button
                        onClick={() => handleCancel(r._id)}
                        className={btnDanger}
                      >
                        Hủy đơn
                      </button>
                    </>
                  )}

                  {r.status === "approved" && (
                    <>
                      <span className="text-gray-600 text-xs md:text-sm md:mt-1 md:mr-2">
                        Đã gửi hợp đồng, chờ khách ký.
                      </span>
                      <button
                        onClick={() => handleCancel(r._id)}
                        className={btnDanger}
                      >
                        Hủy đơn
                      </button>
                    </>
                  )}

                  {r.status === "rented" && (
                    <button
                      onClick={() => handleCancel(r._id)}
                      className={btnDanger}
                    >
                      Xử lý yêu cầu hủy
                    </button>
                  )}

                  {r.status === "cancelling" && (
                    <span className="text-orange-600 font-semibold text-xs md:text-sm px-4 py-2 rounded-full bg-orange-50 border border-orange-100 inline-flex items-center justify-center">
                      Đang xử lý yêu cầu hủy...
                    </span>
                  )}

                  {r.status === "cancelled" && (
                    <span className="text-red-600 font-semibold text-xs md:text-sm px-4 py-2 rounded-full bg-red-50 border border-red-100 inline-flex items-center justify-center">
                      Đơn đã hủy
                    </span>
                  )}
                </div>
              </div>
            ))}
        </section>
      </main>
    </div>
  );
};

export default AdminRentals;
