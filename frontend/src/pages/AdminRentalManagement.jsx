import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const API_BASE = "http://localhost:5000";

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
    await axios.put(`${API_BASE}/api/rentals/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchRentals();
  };

  const handleCancel = async (id) => {
    await axios.put(`${API_BASE}/api/rentals/${id}/cancel-admin`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchRentals();
  };

  const finishCancellation = async (id) => {
    await axios.put(`${API_BASE}/api/rentals/${id}/cancel-admin`, { finish: true }, { headers: { Authorization: `Bearer ${token}` } });
    fetchRentals();
  };

  useEffect(() => { fetchRentals(); }, []);

  if (loading) return <p className="text-center mt-20 text-gray-500">Đang tải...</p>;

  return (
    <div className="max-w-7xl mx-auto mt-12 p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Quản lý đăng ký hợp đồng</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg shadow-md">
          <thead className="bg-green-700 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Căn hộ</th>
              <th className="px-4 py-2 text-left">Người thuê</th>
              <th className="px-4 py-2">Bắt đầu</th>
              <th className="px-4 py-2">Kết thúc</th>
              <th className="px-4 py-2">Tổng tiền</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {rentals.map((r) => (
              <tr key={r._id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-medium">{r.apartment?.title}</td>
                <td className="px-4 py-2">{r.user?.name}</td>
                <td className="px-4 py-2">{new Date(r.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-2">{new Date(r.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-2 font-semibold">{r.totalPrice.toLocaleString()} đ</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                    r.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    r.status === "approved" ? "bg-blue-100 text-blue-800" :
                    r.status === "rented" ? "bg-green-100 text-green-800" :
                    r.status === "cancelling" ? "bg-orange-100 text-orange-800" :
                    r.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                  }`}>
                    {r.status === "pending" ? "Đang chờ" :
                     r.status === "approved" ? "Đã duyệt" :
                     r.status === "rented" ? "Đang thuê" :
                     r.status === "cancelling" ? "Đang hủy" :
                     r.status === "cancelled" ? "Đã hủy" : r.status}
                  </span>
                </td>
                <td className="px-4 py-2 flex flex-col md:flex-row gap-2 items-center justify-center">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => handleApprove(r._id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition">Duyệt</button>
                      <button onClick={() => handleCancel(r._id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">Hủy</button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <>
                      <span className="text-gray-600">Chờ khách ký</span>
                      <button onClick={() => handleCancel(r._id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">Hủy</button>
                    </>
                  )}
                  {r.status === "rented" && (
                    <button onClick={() => handleCancel(r._id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition">Yêu cầu hủy</button>
                  )}
                  {r.status === "cancelling" && (
                    <button onClick={() => finishCancellation(r._id)} className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 transition">Hoàn tất</button>
                  )}
                  {r.status === "cancelled" && <span className="text-red-600 font-semibold">Đã hủy</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminRentalManagement;