import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";

const AdminRentals = () => {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/rentals", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setRentals(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.patch(
        `/api/rentals/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchRentals();
    } catch (err) {
      console.log(err);
    }
  };

  if (loading) return <p className="text-center mt-20 text-gray-500">Đang tải...</p>;

  if (!rentals.length)
    return <p className="text-center mt-20 text-gray-500">Chưa có đơn thuê nào.</p>;

  return (
    <div className="max-w-6xl mx-auto mt-10 p-4">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Quản lý đơn thuê</h2>
      <div className="space-y-4">
        {rentals.map((r) => (
          <div
            key={r._id}
            className="border rounded-lg shadow p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 hover:shadow-lg transition"
          >
            <div className="flex-1 space-y-1">
              <p>
                <span className="font-semibold">User:</span> {r.user.name} ({r.user.email})
              </p>
              <p>
                <span className="font-semibold">Căn hộ:</span> {r.apartment.title}
              </p>
              <p>
                <span className="font-semibold">Ngày thuê:</span>{" "}
                {new Date(r.startDate).toLocaleDateString()} -{" "}
                {new Date(r.endDate).toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Tổng tiền:</span>{" "}
                {r.totalPrice.toLocaleString()} VND
              </p>
              <p>
                <span className="font-semibold">Trạng thái:</span>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    r.status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : r.status === "confirmed"
                      ? "bg-blue-100 text-blue-800"
                      : r.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {r.status === "pending"
                    ? "Đang chờ"
                    : r.status === "confirmed"
                    ? "Đã xác nhận"
                    : r.status === "cancelled"
                    ? "Đã hủy"
                    : r.status}
                </span>
              </p>
            </div>

            {r.status === "pending" && (
              <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
                <button
                  onClick={() => updateStatus(r._id, "confirmed")}
                  className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Xác nhận
                </button>
                <button
                  onClick={() => updateStatus(r._id, "cancelled")}
                  className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminRentals;
