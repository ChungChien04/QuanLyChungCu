import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import SignContractModal from "../components/SignContractModal";
import PaymentQrModal from "../components/PaymentQrModal";

const API_BASE = "http://localhost:5000";

// ======= TOAST COMPONENT =======
const Toast = ({ message, type = "success", onClose }) => {
  if (!message) return null;
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded shadow-lg animate-slideIn`}
    >
      {message}
    </div>
  );
};

const MyRentals = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);
  const [signedText, setSignedText] = useState(""); // lưu chữ ký
  const [qrModal, setQrModal] = useState({ open: false, src: null, id: null });
  const [signModalOpen, setSignModalOpen] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 5000);
  };

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/my-rentals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(data);
    } catch (err) {
      console.error(err);
      showToast("Lỗi tải danh sách hợp đồng", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = (rental) => {
    setSelectedRental(rental);
    setSignModalOpen(true);
    setSignedText(rental.contractText || ""); // nếu đã có chữ ký cũ
  };

  const handlePayment = async (id) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/${id}/pay-init`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const src = data.qr?.startsWith("http") ? data.qr : `${API_BASE}${data.qr}`;
      setQrModal({ open: true, src, id });
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    }
  };

  const confirmPayment = async (id, signature) => {
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/pay`,
        { signature }, // gửi chữ ký lên backend
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrModal({ open: false, src: null, id: null });
      fetchRentals();
      showToast("Thanh toán xác nhận thành công!");
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi khi xác nhận thanh toán", "error");
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  if (loading)
    return <p className="text-center mt-20 text-gray-500">Đang tải...</p>;

  if (!rentals.length)
    return <p className="text-center mt-20 text-gray-500">Chưa có đơn đăng ký hợp đồng.</p>;

  return (
    <div className="max-w-4xl mx-auto mt-20 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Quản lý hợp đồng của tôi</h1>

      <div className="space-y-4">
        {rentals.map((r) => (
          <div
            key={r._id}
            className="border rounded-lg shadow p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2"
          >
            <div className="flex-1 space-y-1">
              <p><span className="font-semibold">Căn hộ:</span> {r.apartment?.title || "Không có dữ liệu"}</p>
              <p><span className="font-semibold">Thời gian:</span> {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</p>
              <p><span className="font-semibold">Tổng tiền:</span> {r.totalPrice.toLocaleString()} đ</p>
              <p>
                <span className="font-semibold">Trạng thái:</span>{" "}
                <span className={
                  r.status === "pending" ? "text-yellow-600" :
                  r.status === "approved" ? "text-blue-600" :
                  r.status === "cancelled" ? "text-red-600" :
                  "text-gray-700"
                }>
                  {r.status === "pending" ? "Đang chờ duyệt" :
                   r.status === "approved" ? "Đã được duyệt" :
                   r.status === "cancelled" ? "Đã hủy" : ""}
                </span>
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0">
              {r.status === "approved" && !r.contractSigned && (
                <button
                  onClick={() => handleSignContract(r)}
                  className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                >
                  Ký hợp đồng
                </button>
              )}
              {r.contractSigned && !r.paymentDone && r.status !== "cancelled" && (
                <button
                  onClick={() => handlePayment(r._id)}
                  className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 transition"
                >
                  Thanh toán
                </button>
              )}
              {r.paymentDone && (
                <span className="text-green-700 font-semibold flex items-center">
                  Hợp đồng hoàn tất ✅
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sign Modal */}
      <SignContractModal
        open={signModalOpen}
        rental={selectedRental} 
        defaultText={signedText} // hiển thị chữ ký nếu đã có
        onClose={() => {
          setSignModalOpen(false);
          setSelectedRental(null);
        }}
        onConfirm={async (text) => {
          try {
            if (!selectedRental) return alert("Không có đơn hợp đồng");

            // Lưu chữ ký vào state chung
            setSignedText(text);

            await axios.put(
              `${API_BASE}/api/rentals/${selectedRental._id}/sign`,
              { contractText: text },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setSignModalOpen(false);
            setSelectedRental(null);
            fetchRentals();
            showToast("Ký hợp đồng thành công");
          } catch (err) {
            showToast(err.response?.data?.message || "Lỗi ký hợp đồng");
          }
        }}
      />

      {/* QR Modal */}
      <PaymentQrModal
        open={qrModal.open}
        src={qrModal.src}
        onClose={() => setQrModal({ open: false, src: null, id: null })}
        onConfirm={() => confirmPayment(qrModal.id, signedText)} // gửi chữ ký khi thanh toán
      />

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
};

export default MyRentals;
