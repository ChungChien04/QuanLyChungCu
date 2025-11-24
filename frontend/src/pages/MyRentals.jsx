import React, { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import SignContractModal from "../components/SignContractModal";

// Sửa lỗi "process is not defined" bằng cách dùng cứng localhost hoặc import.meta.env
const API_BASE = "http://localhost:5000";

// ======= TOAST COMPONENT =======
const Toast = ({ message, type = "success" }) => {
  if (!message) return null;
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded shadow-lg animate-slideIn z-50`}
    >
      {message}
    </div>
  );
};

const MyRentals = () => {
  const { token } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  // State cho Modal Ký tên
  const [selectedRental, setSelectedRental] = useState(null);
  const [signModalOpen, setSignModalOpen] = useState(false);

  // State loading cho hành động cụ thể (tránh click nhiều lần)
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 4000);
  };

  const fetchRentals = async () => {
    // Chỉ set loading toàn trang lần đầu
    if (rentals.length === 0) setLoading(true);
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

  // --- LOGIC XỬ LÝ KHI VNPAY REDIRECT VỀ ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const status = query.get("status");

    if (status) {
      if (status === "success") {
        showToast("Thanh toán thành công! Hợp đồng đã hoàn tất.", "success");
      } else if (status === "failed") {
        showToast("Giao dịch thất bại hoặc bị hủy bỏ.", "error");
      } else if (status === "invalid") {
        showToast("Dữ liệu thanh toán không hợp lệ!", "error");
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      fetchRentals();
    } else {
      fetchRentals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- XỬ LÝ KÝ HỢP ĐỒNG ---
  const handleSignContract = (rental) => {
    setSelectedRental(rental);
    setSignModalOpen(true);
  };

  const onSignConfirm = async (text) => {
    if (!selectedRental) return;
    setActionLoading(true);
    try {
      await axios.put(
        `${API_BASE}/api/rentals/${selectedRental._id}/sign`,
        { contractText: text },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Ký hợp đồng thành công");
      setSignModalOpen(false);
      setSelectedRental(null);
      fetchRentals();
    } catch (err) {
      showToast(err.response?.data?.message || "Lỗi ký hợp đồng", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- XỬ LÝ THANH TOÁN ---
  const handlePaymentInit = async (id) => {
    setActionLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE}/api/payments/create_payment_url/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Không lấy được link thanh toán từ hệ thống.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.response?.data?.message || "Lỗi khởi tạo thanh toán",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <p className="text-center mt-20 text-gray-500 animate-pulse">
        Đang tải dữ liệu...
      </p>
    );

  if (!rentals.length)
    return (
      <p className="text-center mt-20 text-gray-500">
        Chưa có đơn đăng ký hợp đồng nào.
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto mt-20 p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-green-700">
        Hợp đồng của tôi
      </h1>
      <div className="space-y-4">
        {rentals.map((r) => (
          <div
            key={r._id}
            className="bg-white border rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col md:flex-row gap-4"
          >
            {/* Thông tin chi tiết */}
            <div className="flex-1 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between items-start">
                <span className="font-semibold text-gray-900 text-lg">
                  {r.apartment?.title || "Căn hộ không tồn tại"}
                </span>

                {/* --- PHẦN SỬA LỖI HIỂN THỊ TRẠNG THÁI --- */}
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide ${(() => {
                    // 1. Đã hủy
                    if (r.status === "cancelled" || r.status === "cancelling")
                      return "bg-red-100 text-red-700";
                    // 2. Đã thanh toán / Thuê thành công
                    if (r.paymentDone || r.status === "rented")
                      return "bg-green-100 text-green-700";
                    // 3. Đã ký HĐ nhưng chưa thanh toán (Tránh bị hiện "Đã hủy")
                    if (r.contractSigned && !r.paymentDone)
                      return "bg-blue-100 text-blue-700";
                    // 4. Đã duyệt nhưng chưa ký
                    if (r.status === "approved")
                      return "bg-indigo-100 text-indigo-700";
                    // 5. Mặc định
                    return "bg-yellow-100 text-yellow-700";
                  })()}`}
                >
                  {(() => {
                    if (r.status === "cancelled") return "Đã hủy";
                    if (r.status === "cancelling") return "Đang hủy";
                    if (r.paymentDone || r.status === "rented")
                      return "Hoàn tất";
                    if (r.status === "approved") {
                      if (r.contractSigned) return "Chờ thanh toán";
                      return "Chờ ký HĐ";
                    }
                    return "Chờ duyệt";
                  })()}
                </span>
                {/* --- HẾT PHẦN SỬA --- */}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <p>
                  📅 <span className="font-semibold">Bắt đầu:</span>{" "}
                  {new Date(r.startDate).toLocaleDateString("vi-VN")}
                </p>
                <p>
                  📅 <span className="font-semibold">Kết thúc:</span>{" "}
                  {new Date(r.endDate).toLocaleDateString("vi-VN")}
                </p>
                <p className="md:col-span-2">
                  💰 <span className="font-semibold">Tổng tiền:</span>{" "}
                  <span className="text-red-600 font-bold text-base">
                    {r.totalPrice?.toLocaleString()} đ
                  </span>
                </p>
              </div>
            </div>

            {/* Nút thao tác */}
            <div className="flex flex-col justify-center gap-2 min-w-[140px]">
              {/* Bước 1: Ký hợp đồng */}
              {r.status === "approved" && !r.contractSigned && (
                <button
                  onClick={() => handleSignContract(r)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  ✍️ Ký hợp đồng
                </button>
              )}

              {/* Bước 2: Thanh toán (Chỉ hiện khi đã ký + chưa thanh toán + chưa hủy) */}
              {r.contractSigned &&
                !r.paymentDone &&
                r.status !== "cancelled" && (
                  <button
                    onClick={() => handlePaymentInit(r._id)}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {actionLoading ? "Đang xử lý..." : "💳 Thanh toán"}
                  </button>
                )}

              {/* Hoàn tất */}
              {r.paymentDone && (
                <div className="text-green-600 font-bold text-sm flex items-center justify-center border border-green-200 bg-green-50 py-2 rounded gap-1">
                  ✅ Đã thanh toán
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <SignContractModal //  Trong file MyRentals.js
        open={signModalOpen} 
        rental={selectedRental}
        defaultText={selectedRental?.contractText || ""}
        loading={actionLoading} // <--- THÊM DÒNG NÀY
        onClose={() => {
          setSignModalOpen(false);
          setSelectedRental(null);
        }}
        onConfirm={onSignConfirm}
      />
      <Toast message={toast.message} type={toast.type} />
    </div>
  );
};

export default MyRentals;