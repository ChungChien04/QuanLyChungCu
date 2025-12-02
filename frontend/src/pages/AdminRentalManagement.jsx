import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const API_BASE = "http://localhost:5000";

// ⭐ Format dd/MM/yyyy
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

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

const AdminRentalManagement = () => {
  const { user, token } = useAuth() || {};
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({ message: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type }), 2200);
  };

  const fetchRentals = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // sort mới nhất lên đầu cho dễ quản lý
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate).getTime() -
          new Date(a.createdAt || a.startDate).getTime()
      );
      setRentals(sorted);
    } catch (err) {
      console.error(err);
      showToast("Lỗi tải danh sách hợp đồng!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Xác nhận duyệt đăng ký hợp đồng này?")) return;
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Đã duyệt hợp đồng!", "success");
      fetchRentals();
    } catch (err) {
      console.error(err);
      showToast("Lỗi duyệt hợp đồng!", "error");
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn hủy đăng ký này?")) return;
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/cancel-admin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Đã cập nhật trạng thái hủy!", "success");
      fetchRentals();
    } catch (err) {
      console.error(err);
      showToast("Lỗi hủy hợp đồng!", "error");
    }
  };

  const finishCancellation = async (id) => {
    if (!window.confirm("Xác nhận hoàn tất quá trình hủy hợp đồng?")) return;
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/cancel-admin`,
        { finish: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Đã hoàn tất hủy hợp đồng!", "success");
      fetchRentals();
    } catch (err) {
      console.error(err);
      showToast("Lỗi hoàn tất hủy!", "error");
    }
  };

  const handleManualPay = async (id) => {
    if (
      !window.confirm("Xác nhận khách đã thanh toán tiền mặt/chuyển khoản?")
    )
      return;
    try {
      await axios.put(
        `${API_BASE}/api/payments/admin/manual-pay-rental/${id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast("Cập nhật thanh toán thành công!", "success");
      fetchRentals();
    } catch (err) {
      console.error(err);
      showToast("Lỗi cập nhật thanh toán!", "error");
    }
  };

  useEffect(() => {
    fetchRentals();
  }, [token]);

  // Chặn nếu không phải admin (đồng bộ với News admin)
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Toast message={toast.message} type={toast.type} />
        <div className="max-w-md w-full bg-white border border-red-100 rounded-2xl shadow-lg p-6">
          <p className="text-sm font-semibold text-red-600 mb-1">
            Truy cập bị từ chối
          </p>
          <p className="text-sm text-slate-600">
            Bạn không có quyền truy cập trang quản lý đăng ký hợp đồng. Vui
            lòng đăng nhập bằng tài khoản admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      <Toast message={toast.message} type={toast.type} />

      {/* HEADER */}
      <section className="bg-gradient-to-b from-emerald-50 to-emerald-100/40 border-b border-emerald-50">
        <div className="max-w-7xl mx-auto px-6 pt-[96px] pb-6">
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-500 mb-2">
            Admin panel
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-emerald-700 mb-1 text-balance">
            Quản lý đăng ký hợp đồng
          </h1>
          <p className="text-sm md:text-base text-emerald-900/80 max-w-2xl">
            Xem, duyệt, quản lý trạng thái hợp đồng thuê và thanh toán ban đầu
            của khách thuê.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        {/* Card thống kê nhỏ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3.5">
            <p className="text-xs text-slate-500 mb-1">Tổng đăng ký</p>
            <p className="text-xl font-semibold text-slate-900">
              {rentals.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-4 py-3.5">
            <p className="text-xs text-emerald-700 mb-1">Đang thuê</p>
            <p className="text-xl font-semibold text-emerald-700">
              {rentals.filter((r) => r.status === "rented").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm px-4 py-3.5">
            <p className="text-xs text-amber-700 mb-1">Đang chờ duyệt</p>
            <p className="text-xl font-semibold text-amber-700">
              {rentals.filter((r) => r.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm px-4 py-3.5">
            <p className="text-xs text-red-700 mb-1">Đã hủy</p>
            <p className="text-xl font-semibold text-red-700">
              {rentals.filter((r) => r.status === "cancelled").length}
            </p>
          </div>
        </section>

        {/* Bảng hợp đồng */}
        <section className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <p className="text-center py-10 text-gray-600 text-sm">
              Đang tải danh sách hợp đồng...
            </p>
          ) : rentals.length === 0 ? (
            <p className="text-center py-10 text-gray-500 text-sm">
              Chưa có đăng ký hợp đồng nào.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-emerald-50/80 border-b border-gray-200">
                  <tr className="text-gray-800">
                    <th className="px-4 py-3 text-left font-semibold">
                      Căn hộ
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Người thuê
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Bắt đầu
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Kết thúc
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Tổng tiền
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Hành động
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {rentals.map((r) => (
                    <tr
                      key={r._id}
                      className="border-t border-gray-100 hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {r.apartment?.title}
                      </td>

                      <td className="px-4 py-3 text-gray-800">
                        {r.user?.name}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(r.startDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(r.endDate)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-emerald-700">
                        {r.totalPrice.toLocaleString()} đ
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            r.status === "pending"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : r.status === "approved"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : r.status === "rented"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : r.status === "cancelling"
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : r.status === "cancelled"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }`}
                        >
                          {r.status === "pending"
                            ? "Đang chờ"
                            : r.status === "approved"
                            ? "Đã duyệt"
                            : r.status === "rented"
                            ? "Đang thuê"
                            : r.status === "cancelling"
                            ? "Đang hủy"
                            : r.status === "cancelled"
                            ? "Đã hủy"
                            : r.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col md:flex-row gap-2 items-center">
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(r._id)}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                              >
                                Duyệt
                              </button>
                              <button
                                onClick={() => handleCancel(r._id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {r.status === "approved" && (
                            <>
                              <span className="text-gray-600 text-xs md:text-sm">
                                Chờ khách ký
                              </span>

                              {r.contractSigned && !r.paymentDone && (
                                <button
                                  onClick={() => handleManualPay(r._id)}
                                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                                >
                                  Xác nhận đã thu
                                </button>
                              )}

                              <button
                                onClick={() => handleCancel(r._id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {r.status === "rented" && (
                            <button
                              onClick={() => handleCancel(r._id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
                            >
                              Đánh dấu hủy
                            </button>
                          )}

                          {r.status === "cancelling" && (
                            <button
                              onClick={() => finishCancellation(r._id)}
                              className="bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-amber-600 shadow-sm"
                            >
                              Hoàn tất hủy
                            </button>
                          )}

                          {r.status === "cancelled" && (
                            <span className="text-red-600 font-semibold text-xs md:text-sm">
                              Đã hủy
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminRentalManagement;
