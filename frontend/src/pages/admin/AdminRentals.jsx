import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const API_BASE = "http://localhost:5000";

const AdminRentals = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH ALL RENTALS
  // ============================
  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/rentals/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(res.data);
    } catch (err) {
      console.error("Fetch Rentals Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  // ============================
  const handleApprove = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRentals();
    } catch (err) {
      console.error("Approve Error:", err.response?.data || err);
      alert("Lỗi duyệt đơn thuê.");
    }
  };

  const handleCancel = async (id) => {
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/cancel-admin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRentals();
    } catch (err) {
      console.error("Cancel Error:", err.response?.data || err);
      alert("Lỗi hủy đơn thuê.");
    }
  };

  // ============================
  if (loading)
    return <p className="text-center mt-20 text-gray-500">Đang tải...</p>;

  if (!rentals.length)
    return (
      <p className="text-center mt-20 text-gray-500">
        Chưa có đơn thuê nào.
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">

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
            Kiểm tra, duyệt yêu cầu thuê, xử lý hủy đơn của người dùng.
          </p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="space-y-4">
          {rentals.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-4"
            >
              {/* INFO */}
              <div className="flex-1 text-sm space-y-1.5">
                <p>
                  <span className="font-semibold text-gray-800">Người thuê:</span>{" "}
                  {r.user?.name} ({r.user?.email})
                </p>

                <p>
                  <span className="font-semibold text-gray-800">Căn hộ:</span>{" "}
                  {r.apartment?.title}
                </p>

                <p>
                  <span className="font-semibold text-gray-800">Ngày thuê:</span>{" "}
                  {new Date(r.startDate).toLocaleDateString()} –{" "}
                  {new Date(r.endDate).toLocaleDateString()}
                </p>

                <p>
                  <span className="font-semibold text-gray-800">Tổng tiền:</span>{" "}
                  <span className="text-emerald-700 font-semibold">
                    {r.totalPrice?.toLocaleString()} đ
                  </span>
                </p>

                {/* STATUS */}
                <p className="mt-2">
                  <span className="font-semibold text-gray-800">Trạng thái:</span>{" "}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border 
                      ${
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
                      }
                    `}
                  >
                    {(
                      {
                        pending: "Đang chờ",
                        approved: "Đã duyệt",
                        rented: "Đang thuê",
                        cancelling: "Đang chờ hủy",
                        cancelled: "Đã hủy",
                      }[r.status] || r.status
                    )}
                  </span>
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                {r.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(r._id)}
                      className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl shadow-sm hover:bg-emerald-700"
                    >
                      Duyệt
                    </button>

                    <button
                      onClick={() => handleCancel(r._id)}
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl shadow-sm hover:bg-red-600"
                    >
                      Hủy
                    </button>
                  </>
                )}

                {r.status === "approved" && (
                  <>
                    <span className="text-gray-600 text-sm md:mr-2">
                      Chờ khách ký
                    </span>
                    <button
                      onClick={() => handleCancel(r._id)}
                      className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl shadow-sm hover:bg-red-600"
                    >
                      Hủy
                    </button>
                  </>
                )}

                {r.status === "rented" && (
                  <button
                    onClick={() => handleCancel(r._id)}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-xl shadow-sm hover:bg-red-600"
                  >
                    Yêu cầu hủy
                  </button>
                )}

                {r.status === "cancelling" && (
                  <span className="text-orange-600 font-semibold text-sm">
                    Đang xử lý hủy...
                  </span>
                )}

                {r.status === "cancelled" && (
                  <span className="text-red-600 font-semibold text-sm">
                    Đã hủy
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminRentals;
