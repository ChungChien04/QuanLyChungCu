import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import SignContractModal from "../components/SignContractModal";
import PaymentQrModal from "../components/PaymentQrModal";

const API_BASE = "http://localhost:5000";

// Toast mini hiển thị góc phải
const Toast = ({ message, type = "success" }) => {
  if (!message) return null;
  
  return (
    <div
      className={`fixed bottom-6 right-6 px-4 py-2 text-white rounded-xl shadow-lg transition
      ${type === "success" ? "bg-green-600" : "bg-red-600"} animate-slideIn`}
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
  const [signedText, setSignedText] = useState("");

  const [qrModal, setQrModal] = useState({ open: false, src: null, id: null });
  const [signModalOpen, setSignModalOpen] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });
  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 4000);
  };

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/my-rentals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRentals(data);
    } catch  {
      showToast("Không tải được hợp đồng", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentals();
  }, []);

  const handleSignContract = (r) => {
    setSelectedRental(r);
    setSignedText(r.contractText || "");
    setSignModalOpen(true);
  };

  const handlePayment = async (id) => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/rentals/${id}/pay-init`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const src = data.qr?.startsWith("http") ? data.qr : `${API_BASE}${data.qr}`;
      setQrModal({ open: true, src, id });
    } catch (err) {
      showToast(err.response?.data?.message || "Không tạo được QR", "error");
    }
  };

  const confirmPayment = async (id, signature) => {
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${id}/pay`,
        { signature },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQrModal({ open: false, src: null, id: null });
      fetchRentals();
      showToast("Thanh toán thành công!");
    } catch {
      showToast("Lỗi khi xác nhận thanh toán", "error");
    }
  };

  if (loading)
    return <p className="text-center mt-20 text-gray-500">Đang tải dữ liệu...</p>;

  if (!rentals.length)
    return (
      <p className="text-center mt-20 text-gray-500 text-lg">
        Bạn chưa có hợp đồng nào.
      </p>
    );

  return (
    <div className="max-w-5xl mx-auto mt-24 p-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-green-700">
        Quản lý hợp đồng của tôi
      </h1>

      <div className="space-y-5">
        {rentals.map((r) => (
          <div
            key={r._id}
            className="border rounded-2xl shadow-sm hover:shadow-md transition p-6 bg-white"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {r.apartment?.title}
              </h2>

              <span
                className={`px-3 py-1 text-sm rounded-full font-medium
                ${
                  r.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : r.status === "approved"
                    ? "bg-blue-100 text-blue-700"
                    : r.status === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : r.paymentDone
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {r.status === "pending"
                  ? "Đang chờ duyệt"
                  : r.status === "approved"
                  ? "Đã được duyệt"
                  : r.status === "cancelled"
                  ? "Đã hủy"
                  : r.paymentDone
                  ? "Hoàn tất"
                  : ""}
              </span>
            </div>

            {/* Body */}
            <div className="space-y-1 text-gray-700">
              <p>
                <b>Thời gian:</b>{" "}
                {new Date(r.startDate).toLocaleDateString()} –{" "}
                {new Date(r.endDate).toLocaleDateString()}
              </p>
              <p>
                <b>Tổng tiền:</b> {r.totalPrice.toLocaleString()} đ
              </p>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-3">
              {r.status === "approved" && !r.contractSigned && (
                <button
                  onClick={() => handleSignContract(r)}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Ký hợp đồng
                </button>
              )}

              {r.contractSigned && !r.paymentDone && r.status !== "cancelled" && (
                <button
                  onClick={() => handlePayment(r._id)}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Thanh toán
                </button>
              )}

              {r.paymentDone && (
                <span className="text-green-700 font-semibold flex items-center">
                  ✔ Hợp đồng hoàn tất
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* SIGN MODAL */}
      <SignContractModal
        open={signModalOpen}
        rental={selectedRental}
        defaultText={signedText}
        onClose={() => {
          setSignModalOpen(false);
          setSelectedRental(null);
        }}
        onConfirm={async (text) => {
          try {
            if (!selectedRental) return;
            await axios.put(
              `${API_BASE}/api/rentals/${selectedRental._id}/sign`,
              { contractText: text },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            setSignModalOpen(false);
            fetchRentals();
            showToast("Ký hợp đồng thành công!");
          } catch {
            showToast("Lỗi ký hợp đồng", "error");
          }
        }}
      />

      {/* PAYMENT QR MODAL */}
      <PaymentQrModal
        open={qrModal.open}
        src={qrModal.src}
        onClose={() => setQrModal({ open: false, src: null, id: null })}
        onConfirm={() => confirmPayment(qrModal.id, signedText)}
      />

      {/* TOAST */}
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
};

export default MyRentals;
