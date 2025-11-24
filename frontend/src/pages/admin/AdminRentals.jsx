import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const API_BASE = "http://localhost:5000";

const AdminRentals = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // FETCH TẤT CẢ ĐƠN THUÊ (ADMIN)
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
  // ADMIN DUYỆT
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

  // ============================
  // ADMIN HỦY ĐƠN
  // ============================
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
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Quản lý đơn thuê
      </h2>

      <div className="space-y-4">
        {rentals.map((r) => (
          <div
            key={r._id}
            className="border rounded-lg shadow p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 hover:shadow-lg transition"
          >
            <div className="flex-1 space-y-1">
              <p>
                <span className="font-semibold">Người thuê:</span>{" "}
                {r.user?.name} ({r.user?.email})
              </p>

              <p>
                <span className="font-semibold">Căn hộ:</span>{" "}
                {r.apartment?.title}
              </p>

              <p>
                <span className="font-semibold">Ngày thuê:</span>{" "}
                {new Date(r.startDate).toLocaleDateString()} –{" "}
                {new Date(r.endDate).toLocaleDateString()}
              </p>

              <p>
                <span className="font-semibold">Tổng tiền:</span>{" "}
                {r.totalPrice?.toLocaleString()} đ
              </p>

              {/* STATUS LABEL */}
              <p>
                <span className="font-semibold">Trạng thái:</span>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    r.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : r.status === "approved"
                      ? "bg-blue-100 text-blue-800"
                      : r.status === "rented"
                      ? "bg-green-100 text-green-800"
                      : r.status === "cancelling"
                      ? "bg-orange-100 text-orange-800"
                      : r.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {{
                    pending: "Đang chờ",
                    approved: "Đã duyệt",
                    rented: "Đang thuê",
                    cancelling: "Đang chờ hủy",
                    cancelled: "Đã hủy",
                  }[r.status] || r.status}
                </span>
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
              {r.status === "pending" && (
                <>
                  <button
                    onClick={() => handleApprove(r._id)}
                    className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    Duyệt
                  </button>

                  <button
                    onClick={() => handleCancel(r._id)}
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Hủy
                  </button>
                </>
              )}

              {r.status === "approved" && (
                <>
                  <span className="text-gray-600">Chờ khách ký</span>
                  <button
                    onClick={() => handleCancel(r._id)}
                    className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Hủy
                  </button>
                </>
              )}

              {r.status === "rented" && (
                <button
                  onClick={() => handleCancel(r._id)}
                  className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Yêu cầu hủy
                </button>
              )}

              {r.status === "cancelling" && (
                <span className="text-orange-600 font-semibold">
                  Đang xử lý hủy...
                </span>
              )}

              {r.status === "cancelled" && (
                <span className="text-red-600 font-semibold">Đã hủy</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRentals;
