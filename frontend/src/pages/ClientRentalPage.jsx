// /frontend/src/pages/ClientRentalPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const API_BASE = "http://localhost:5000";

const ClientRentalPage = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState(null);
  const [signature, setSignature] = useState("");

  const fetchRentals = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/my-rentals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRentals(); }, []);

  const handleSign = async (id) => {
    if (!signature.trim()) return alert("Nhập chữ ký trước khi ký.");
    await axios.post(`${API_BASE}/api/rentals/${id}/sign`, { signature }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSigningId(null);
    setSignature("");
    fetchRentals();
  };

  const handlePay = async (id) => {
    const { data } = await axios.post(`${API_BASE}/api/rentals/${id}/pay`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert(`Thanh toán thành công. QR code: ${data.qr}`);
    fetchRentals();
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có muốn hủy hợp đồng này?")) return;
    await axios.put(`${API_BASE}/api/rentals/${id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchRentals();
  };

  if (loading) return <p className="text-center mt-10">Đang tải...</p>;

  return (
    <div className="max-w-6xl mx-auto pt-[80px] pb-20 px-6">
      <h1 className="text-3xl font-bold mb-6">Hợp đồng của tôi</h1>
      {rentals.length === 0 && <p>Chưa có hợp đồng nào.</p>}
      {rentals.map((r) => (
        <div key={r._id} className="border p-4 mb-4 rounded-lg shadow-md">
          <h2 className="font-semibold">{r.apartment?.title}</h2>
          <p>Ngày bắt đầu: {new Date(r.startDate).toLocaleDateString()}</p>
          <p>Ngày kết thúc: {new Date(r.endDate).toLocaleDateString()}</p>
          <p>Tổng tiền: {r.totalPrice.toLocaleString()} đ</p>
          <p>Trạng thái: {r.status}</p>

          {r.status === "approved" && !r.contractSigned && (
            <>
              {signingId !== r._id ? (
                <button onClick={() => setSigningId(r._id)} className="bg-green-600 text-white px-3 py-1 rounded mt-2">Ký hợp đồng</button>
              ) : (
                <div className="mt-2">
                  <input type="text" value={signature} onChange={e => setSignature(e.target.value)} placeholder="Nhập chữ ký" className="border p-1 rounded"/>
                  <button onClick={() => handleSign(r._id)} className="bg-blue-600 text-white px-3 py-1 rounded ml-2">Gửi</button>
                </div>
              )}
            </>
          )}

          {r.status === "rented" && (
            <>
              {!r.paymentDone && <button onClick={() => handlePay(r._id)} className="bg-yellow-500 text-white px-3 py-1 rounded mt-2">Thanh toán</button>}
              <button onClick={() => handleCancel(r._id)} className="bg-red-600 text-white px-3 py-1 rounded mt-2 ml-2">Hủy hợp đồng</button>
            </>
          )}

          {r.status === "cancelling" && <p className="text-gray-500 mt-2">Đang xử lý hủy hợp đồng...</p>}
          {r.status === "cancelled" && <p className="text-gray-500 mt-2">Đã hủy</p>}
        </div>
      ))}
    </div>
  );
};

export default ClientRentalPage;
