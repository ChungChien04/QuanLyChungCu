import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const API_BASE = "http://localhost:5000";

// ⭐ Hàm format dd/MM/yyyy
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const AdminRentalManagement = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    await axios.put(
      `${API_BASE}/api/rentals/${id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchRentals();
  };

  const handleCancel = async (id) => {
    await axios.put(
      `${API_BASE}/api/rentals/${id}/cancel-admin`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchRentals();
  };

  const finishCancellation = async (id) => {
    await axios.put(
      `${API_BASE}/api/rentals/${id}/cancel-admin`,
      { finish: true },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchRentals();
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
      alert("Cập nhật thành công!");
      fetchRentals();
    } catch  {
      alert("Lỗi cập nhật");
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
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

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
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
                                className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-600"
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
                                  Đã thu
                                </button>
                              )}

                              <button
                                onClick={() => handleCancel(r._id)}
                                className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-600"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {r.status === "rented" && (
                            <button
                              onClick={() => handleCancel(r._id)}
                              className="bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-red-600"
                            >
                              Yêu cầu hủy
                            </button>
                          )}

                          {r.status === "cancelling" && (
                            <button
                              onClick={() => finishCancellation(r._id)}
                              className="bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:bg-amber-600"
                            >
                              Hoàn tất
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
        </div>
      </main>
    </div>
  );
};

export default AdminRentalManagement;
